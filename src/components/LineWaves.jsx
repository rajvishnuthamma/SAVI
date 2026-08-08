import { useRef, useEffect } from "react";

const LineWaves = ({
  speed = 0.3,
  innerLineCount = 32,
  outerLineCount = 36,
  warpIntensity = 1,
  rotation = -45,
  edgeFadeWidth = 0,
  colorCycleSpeed = 1,
  brightness = 0.2,
  color1 = "#ffffff",
  color2 = "#ffffff",
  color3 = "#ffffff",
  enableMouseInteraction = true,
  mouseInfluence = 2
}) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let time = 0;
    
    const mouse = { x: 0, y: 0, hover: false };
    
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.hover = true;
    };
    
    const handleMouseLeave = () => {
      mouse.hover = false;
    };
    
    if (enableMouseInteraction) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseleave', handleMouseLeave);
    }
    
    const resize = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    
    window.addEventListener('resize', resize);
    resize();
    
    const render = () => {
      time += 0.01 * speed;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const totalLines = innerLineCount + outerLineCount;
      const lineSpacing = 6;
      
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((rotation * Math.PI) / 180);
      
      const gradient = ctx.createLinearGradient(-cx, 0, cx, 0);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(0.5, color2);
      gradient.addColorStop(1, color3);
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      
      const maxExtent = Math.max(canvas.width, canvas.height) * 1.5;
      
      for (let i = 0; i < totalLines; i++) {
        ctx.beginPath();
        
        // Spread lines out vertically
        const yOffset = (i - totalLines / 2) * lineSpacing;
        
        // Edge fade based on index
        let alpha = brightness;
        if (edgeFadeWidth > 0) {
           const edgeDist = Math.abs(i - totalLines / 2) / (totalLines / 2);
           if (edgeDist > (1 - edgeFadeWidth)) {
              alpha *= (1 - edgeDist) / edgeFadeWidth;
           }
        }
        ctx.globalAlpha = Math.max(0, alpha);
        
        for (let x = -maxExtent; x <= maxExtent; x += 15) {
          let nx = x * 0.003;
          let ny = i * 0.05;
          let noise = Math.sin(nx + time + ny) + Math.cos(nx * 1.5 - time * 0.8 + ny);
          let y = noise * 30 * warpIntensity;
          
          if (enableMouseInteraction && mouse.hover) {
             // Calculate approximate distance from mouse
             // We need to un-rotate the mouse coordinate for an exact calculation, 
             // but a simplified radial effect works nicely too.
             const cosR = Math.cos(-rotation * Math.PI / 180);
             const sinR = Math.sin(-rotation * Math.PI / 180);
             const mxRot = (mouse.x - cx) * cosR - (mouse.y - cy) * sinR;
             const myRot = (mouse.x - cx) * sinR + (mouse.y - cy) * cosR;
             
             const dx = x - mxRot;
             const dy = (y + yOffset) - myRot;
             const dist = Math.sqrt(dx * dx + dy * dy);
             
             if (dist < 200) {
               const influence = (200 - dist) / 200;
               y += Math.sin(dist * 0.05 - time * 5) * 15 * influence * mouseInfluence;
             }
          }
          
          if (x === -maxExtent) {
            ctx.moveTo(x, y + yOffset);
          } else {
            ctx.lineTo(x, y + yOffset);
          }
        }
        ctx.stroke();
      }
      
      ctx.restore();
      
      animationFrameId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      window.removeEventListener('resize', resize);
      if (enableMouseInteraction) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    speed, innerLineCount, outerLineCount, warpIntensity, rotation, 
    edgeFadeWidth, colorCycleSpeed, brightness, color1, color2, color3, 
    enableMouseInteraction, mouseInfluence
  ]);
  
  return (
    <canvas 
      ref={canvasRef} 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: enableMouseInteraction ? 'auto' : 'none',
        display: 'block'
      }} 
    />
  );
};

export default LineWaves;
