'use client';

// components/NetworkBackground.jsx
import { useEffect, useRef } from 'react';

const NetworkBackground = ({ 
  nodeCount = 70, 
  maxDist = 160, 
  nodeRadius = 2.4,
  linkOpacity = 0.5,
  speed = 0.4,
  nodeColor = '#62c8ff',
  linkColor = '#3aa8ff',
  className = ''
}) => {
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const nodesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    let nodes = [];

    // Resize handler
    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initNodes();
    };

    // Initialize nodes
    const initNodes = () => {
      nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * speed * 1.2,
          vy: (Math.random() - 0.5) * speed * 1.2,
          radius: nodeRadius + Math.random() * 1.4,
          phase: Math.random() * Math.PI * 2
        });
      }
      nodesRef.current = nodes;
    };

    // Animation loop
    const animate = () => {
      const currentNodes = nodesRef.current;
      
      // Update positions
      for (let i = 0; i < currentNodes.length; i++) {
        const n = currentNodes[i];
        n.x += n.vx;
        n.y += n.vy;

        // Bounce off edges
        if (n.x < 0 || n.x > width) {
          n.vx *= -0.98;
          n.x = Math.min(Math.max(n.x, 0), width);
        }
        if (n.y < 0 || n.y > height) {
          n.vy *= -0.98;
          n.y = Math.min(Math.max(n.y, 0), height);
        }

        // Random drift
        n.vx += (Math.random() - 0.5) * 0.02;
        n.vy += (Math.random() - 0.5) * 0.02;

        // Limit speed
        const maxSpeed = 0.8;
        let sp = Math.hypot(n.vx, n.vy);
        if (sp > maxSpeed) {
          n.vx = (n.vx / sp) * maxSpeed;
          n.vy = (n.vy / sp) * maxSpeed;
        }
      }

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw links
      for (let i = 0; i < currentNodes.length; i++) {
        for (let j = i + 1; j < currentNodes.length; j++) {
          const a = currentNodes[i];
          const b = currentNodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * linkOpacity;
            
            // Main link
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(80, 190, 255, ${alpha * 0.9})`;
            ctx.lineWidth = 0.8 + (1 - dist / maxDist) * 1.2;
            ctx.stroke();

            // Glow effect for close links
            if (dist < maxDist * 0.4) {
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = `rgba(160, 220, 255, ${alpha * 0.15})`;
              ctx.lineWidth = 4;
              ctx.stroke();
            }
          }
        }
      }

      // Draw nodes
      const time = Date.now() / 1200;
      for (let i = 0; i < currentNodes.length; i++) {
        const n = currentNodes[i];
        const { x, y, radius, phase } = n;
        const pulse = 0.65 + 0.35 * Math.sin(time * 1.1 + phase);
        const r = radius * (0.8 + 0.4 * pulse);
        const glowSize = r * 3.2 + 2;

        // Glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
        gradient.addColorStop(0, `rgba(130, 210, 255, ${0.25 * pulse})`);
        gradient.addColorStop(0.5, `rgba(40, 160, 255, ${0.08 * pulse})`);
        gradient.addColorStop(1, 'rgba(0, 100, 200, 0)');

        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core node
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.shadowColor = 'rgba(80, 200, 255, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Highlight
        ctx.beginPath();
        ctx.arc(x - r * 0.15, y - r * 0.15, r * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
      }

      animationFrameId.current = requestAnimationFrame(animate);
    };

    // Initialize
    resizeCanvas();
    animate();

    // Handle resize with debounce
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeCanvas, 180);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [nodeCount, maxDist, nodeRadius, linkOpacity, speed, nodeColor, linkColor]);

  return (
    <canvas 
      ref={canvasRef}
      className={`network-bg ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        display: 'block',
        pointerEvents: 'none'
      }}
    />
  );
};

export default NetworkBackground;