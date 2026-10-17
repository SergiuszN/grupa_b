// Package openrouter is a minimal client for the OpenRouter APIs used by the
// voice assistant: streamed chat completions with tools, embeddings,
// speech-to-text and text-to-speech.
package openrouter

import (
	"bufio"
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const DefaultBaseURL = "https://openrouter.ai/api/v1"

// Client calls OpenRouter with a single API key.
type Client struct {
	APIKey  string
	BaseURL string
	HTTP    *http.Client
}

// New returns a client for the given key, or nil when the key is empty.
func New(apiKey string) *Client {
	if apiKey == "" {
		return nil
	}
	return &Client{APIKey: apiKey, BaseURL: DefaultBaseURL, HTTP: &http.Client{Timeout: 2 * time.Minute}}
}

// Error is a non-2xx answer from OpenRouter.
type Error struct {
	Status  int
	Message string
}

func (e *Error) Error() string { return fmt.Sprintf("openrouter: %d %s", e.Status, e.Message) }

func (c *Client) post(ctx context.Context, path string, body any) (*http.Response, error) {
	payload, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.BaseURL+path, bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.APIKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Title", "Filharmonia Szczecin")
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode/100 != 2 {
		defer resp.Body.Close()
		raw, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		var e struct {
			Error struct {
				Message string `json:"message"`
			} `json:"error"`
		}
		msg := strings.TrimSpace(string(raw))
		if json.Unmarshal(raw, &e) == nil && e.Error.Message != "" {
			msg = e.Error.Message
		}
		return nil, &Error{Status: resp.StatusCode, Message: msg}
	}
	return resp, nil
}

func (c *Client) postJSON(ctx context.Context, path string, body, out any) error {
	resp, err := c.post(ctx, path, body)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return json.NewDecoder(resp.Body).Decode(out)
}

// --- Chat completions ---

// Message is an OpenAI-compatible chat message.
type Message struct {
	Role       string     `json:"role"`
	Content    string     `json:"content"`
	ToolCalls  []ToolCall `json:"tool_calls,omitempty"`
	ToolCallID string     `json:"tool_call_id,omitempty"`
}

// ToolCall is a function call requested by the model.
type ToolCall struct {
	ID       string `json:"id"`
	Type     string `json:"type"`
	Function struct {
		Name      string `json:"name"`
		Arguments string `json:"arguments"`
	} `json:"function"`
}

// Tool describes a function the model may call; Parameters is a JSON Schema.
type Tool struct {
	Type     string       `json:"type"`
	Function ToolFunction `json:"function"`
}

type ToolFunction struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Parameters  any    `json:"parameters"`
}

// ChatRequest is the body of POST /chat/completions.
type ChatRequest struct {
	Model     string     `json:"model"`
	Messages  []Message  `json:"messages"`
	Tools     []Tool     `json:"tools,omitempty"`
	Reasoning *Reasoning `json:"reasoning,omitempty"`
	MaxTokens int        `json:"max_tokens,omitempty"`
	Stream    bool       `json:"stream"`
}

type Reasoning struct {
	Effort string `json:"effort"`
}

// ChatStream sends a streamed chat completion. onText receives content as it
// arrives; the returned message holds the full content and any tool calls.
func (c *Client) ChatStream(ctx context.Context, r ChatRequest, onText func(string)) (Message, string, error) {
	r.Stream = true
	resp, err := c.post(ctx, "/chat/completions", r)
	if err != nil {
		return Message{}, "", err
	}
	defer resp.Body.Close()

	msg := Message{Role: "assistant"}
	var content strings.Builder
	var calls []ToolCall
	finish := ""

	sc := bufio.NewScanner(resp.Body)
	sc.Buffer(make([]byte, 0, 64*1024), 4*1024*1024)
	for sc.Scan() {
		line := sc.Text()
		data, ok := strings.CutPrefix(line, "data: ")
		if !ok {
			continue // comments such as ": OPENROUTER PROCESSING"
		}
		if data == "[DONE]" {
			break
		}
		var chunk struct {
			Error *struct {
				Message string `json:"message"`
			} `json:"error"`
			Choices []struct {
				Delta struct {
					Content   string `json:"content"`
					ToolCalls []struct {
						Index    int    `json:"index"`
						ID       string `json:"id"`
						Function struct {
							Name      string `json:"name"`
							Arguments string `json:"arguments"`
						} `json:"function"`
					} `json:"tool_calls"`
				} `json:"delta"`
				FinishReason *string `json:"finish_reason"`
			} `json:"choices"`
		}
		if err := json.Unmarshal([]byte(data), &chunk); err != nil {
			continue
		}
		if chunk.Error != nil {
			return Message{}, "", &Error{Status: http.StatusBadGateway, Message: chunk.Error.Message}
		}
		for _, ch := range chunk.Choices {
			if ch.Delta.Content != "" {
				content.WriteString(ch.Delta.Content)
				if onText != nil {
					onText(ch.Delta.Content)
				}
			}
			for _, tc := range ch.Delta.ToolCalls {
				for len(calls) <= tc.Index {
					calls = append(calls, ToolCall{Type: "function"})
				}
				call := &calls[tc.Index]
				if tc.ID != "" {
					call.ID = tc.ID
				}
				call.Function.Name += tc.Function.Name
				call.Function.Arguments += tc.Function.Arguments
			}
			if ch.FinishReason != nil {
				finish = *ch.FinishReason
			}
		}
	}
	if err := sc.Err(); err != nil {
		return Message{}, "", err
	}
	msg.Content = content.String()
	msg.ToolCalls = calls
	return msg, finish, nil
}

// --- Embeddings ---

// Embed returns one embedding per input, in input order.
func (c *Client) Embed(ctx context.Context, model string, inputs []string) ([][]float32, error) {
	var out struct {
		Data []struct {
			Index     int       `json:"index"`
			Embedding []float32 `json:"embedding"`
		} `json:"data"`
	}
	if err := c.postJSON(ctx, "/embeddings", map[string]any{"model": model, "input": inputs}, &out); err != nil {
		return nil, err
	}
	if len(out.Data) != len(inputs) {
		return nil, fmt.Errorf("openrouter: got %d embeddings for %d inputs", len(out.Data), len(inputs))
	}
	vecs := make([][]float32, len(inputs))
	for _, d := range out.Data {
		if d.Index < 0 || d.Index >= len(vecs) {
			return nil, fmt.Errorf("openrouter: embedding index %d out of range", d.Index)
		}
		vecs[d.Index] = d.Embedding
	}
	return vecs, nil
}

// --- Audio ---

// Transcript is the result of speech-to-text.
type Transcript struct {
	Text     string  `json:"text"`
	Language string  `json:"language"`
	Duration float64 `json:"duration"`
}

// Transcribe converts recorded speech to text. format is the audio container, e.g. "wav".
func (c *Client) Transcribe(ctx context.Context, model string, audio []byte, format string) (*Transcript, error) {
	var out Transcript
	err := c.postJSON(ctx, "/audio/transcriptions", map[string]any{
		"model":           model,
		"response_format": "verbose_json",
		"input_audio": map[string]string{
			"data":   base64.StdEncoding.EncodeToString(audio),
			"format": format,
		},
	}, &out)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

// Speech synthesizes text to MP3 audio.
func (c *Client) Speech(ctx context.Context, model, voice, text string) ([]byte, error) {
	resp, err := c.post(ctx, "/audio/speech", map[string]any{
		"model":           model,
		"input":           text,
		"voice":           voice,
		"response_format": "mp3",
	})
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}
