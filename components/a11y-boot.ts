// Applies saved accessibility preferences before first paint, so a reload in
// yellow-on-black or large text never flashes the default page. Mirrors the
// attribute mapping in AccessibilityControl.
export const A11Y_BOOT_SCRIPT = `(function(){try{
var s=JSON.parse(localStorage.getItem("a11y-preferences")||"{}"),r=document.documentElement;
if(s.textSize&&s.textSize!=="normal")r.setAttribute("data-a11y-text",s.textSize);
if(s.contrast&&s.contrast!=="normal")r.setAttribute("data-a11y-contrast",s.contrast);
if(s.highlightLinks)r.setAttribute("data-a11y-links","true");
if(s.bigCursor)r.setAttribute("data-a11y-cursor","big");
if(s.textSpacing)r.setAttribute("data-a11y-spacing","true");
if(s.reduceMotion)r.setAttribute("data-a11y-motion","true");
if(s.grayscale)r.setAttribute("data-a11y-grayscale","true");
if(s.readableFont)r.setAttribute("data-a11y-readable-font","true");
}catch(e){}})();`;
