"use client"

export function ShaderAnimation() {
  return (
    <div className="w-full h-full absolute overflow-hidden">
      <style>{`
        @keyframes shader-drift {
          0% { transform: translateX(-30%) translateY(-20%) rotate(0deg); }
          50% { transform: translateX(10%) translateY(10%) rotate(180deg); }
          100% { transform: translateX(-30%) translateY(-20%) rotate(360deg); }
        }
        @keyframes shader-drift-2 {
          0% { transform: translateX(20%) translateY(30%) rotate(0deg); }
          50% { transform: translateX(-20%) translateY(-10%) rotate(-180deg); }
          100% { transform: translateX(20%) translateY(30%) rotate(-360deg); }
        }
        @keyframes shader-drift-3 {
          0% { transform: translateX(0%) translateY(-40%) rotate(90deg); }
          50% { transform: translateX(-30%) translateY(20%) rotate(270deg); }
          100% { transform: translateX(0%) translateY(-40%) rotate(450deg); }
        }
        @keyframes shader-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        @keyframes shader-line-sweep {
          0% { transform: translateY(-100%) rotate(-35deg); }
          100% { transform: translateY(200%) rotate(-35deg); }
        }
      `}</style>

      <div
        className="absolute inset-0"
        style={{ background: "oklch(0.06 0.02 281)" }}
      />

      {/* Animated gradient orbs */}
      <div
        className="absolute"
        style={{
          width: "140%",
          height: "140%",
          top: "-20%",
          left: "-20%",
          background:
            "radial-gradient(ellipse at 30% 50%, oklch(0.35 0.2 281 / 35%) 0%, transparent 50%)",
          animation: "shader-drift 20s ease-in-out infinite",
        }}
      />
      <div
        className="absolute"
        style={{
          width: "120%",
          height: "120%",
          top: "-10%",
          left: "-10%",
          background:
            "radial-gradient(ellipse at 70% 30%, oklch(0.3 0.18 310 / 30%) 0%, transparent 45%)",
          animation: "shader-drift-2 25s ease-in-out infinite",
        }}
      />
      <div
        className="absolute"
        style={{
          width: "130%",
          height: "130%",
          top: "-15%",
          left: "-15%",
          background:
            "radial-gradient(ellipse at 50% 80%, oklch(0.25 0.15 220 / 25%) 0%, transparent 40%)",
          animation: "shader-drift-3 30s ease-in-out infinite",
        }}
      />

      {/* Animated scan lines for shader-like feel */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute"
          style={{
            width: "200%",
            height: "1px",
            left: "-50%",
            top: "0",
            background: `linear-gradient(90deg, transparent 0%, oklch(0.5 0.22 ${281 + i * 30} / ${15 + i * 5}%) 30%, oklch(0.6 0.18 ${310 - i * 25} / ${10 + i * 5}%) 70%, transparent 100%)`,
            animation: `shader-line-sweep ${8 + i * 4}s linear infinite`,
            animationDelay: `${i * 3}s`,
          }}
        />
      ))}

      {/* Subtle noise-like grain overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
          opacity: 0.5,
          animation: "shader-pulse 8s ease-in-out infinite",
        }}
      />
    </div>
  )
}
