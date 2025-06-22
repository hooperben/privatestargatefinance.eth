"use client";

import { Button } from "./ui/button";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-black overflow-hidden">
      {/* Animated SVG Background */}
      <svg
        className="absolute inset-0 w-full h-full scale-200 md:scale-100"
        viewBox="0 0 1400 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Grid Lines - Light and Skinny */}
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.3"
              className="text-gray-300 dark:text-gray-700 opacity-40"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Main X and Y Axis - Dark and Prominent */}
        <line
          x1="0"
          y1="400"
          x2="1400"
          y2="400"
          stroke="currentColor"
          strokeWidth="2"
          className="text-black dark:text-white opacity-80"
        />
        <line
          x1="700"
          y1="0"
          x2="700"
          y2="800"
          stroke="currentColor"
          strokeWidth="2"
          className="text-black dark:text-white opacity-80"
        />

        {/* Red Elliptic Curve */}
        <ellipse
          cx="700"
          cy="400"
          rx="300"
          ry="150"
          stroke="#dc2626"
          strokeWidth="2"
          fill="none"
          className="opacity-70 animate-pulse-slow"
          transform="rotate(-15 700 400)"
        />
        <ellipse
          cx="700"
          cy="400"
          rx="200"
          ry="100"
          stroke="#ef4444"
          strokeWidth="1.5"
          fill="none"
          className="opacity-50 animate-pulse-medium"
          transform="rotate(10 700 400)"
        />

        {/* Flowing Lines - More Subtle Now */}
        <g className="animate-pulse-slow opacity-30">
          <path
            d="M-100 200 Q200 180 400 200 T800 220 Q1000 230 1200 210 T1600 200"
            stroke="currentColor"
            strokeWidth="0.8"
            fill="none"
            className="text-black dark:text-white"
          />
          <path
            d="M-100 240 Q200 220 400 240 T800 260 Q1000 270 1200 250 T1600 240"
            stroke="currentColor"
            strokeWidth="0.8"
            fill="none"
            className="text-black dark:text-white"
          />
          <path
            d="M-100 280 Q200 260 400 280 T800 300 Q1000 310 1200 290 T1600 280"
            stroke="currentColor"
            strokeWidth="0.8"
            fill="none"
            className="text-black dark:text-white"
          />
        </g>

        {/* Left Circle Group - More Subtle */}
        <g className="animate-pulse-organic opacity-40">
          <circle
            cx="280"
            cy="280"
            r="60"
            stroke="currentColor"
            strokeWidth="0.8"
            fill="none"
            className="text-black dark:text-white"
          />
          <circle
            cx="320"
            cy="260"
            r="40"
            stroke="currentColor"
            strokeWidth="0.8"
            fill="none"
            className="text-black dark:text-white"
          />
          <circle
            cx="350"
            cy="300"
            r="25"
            stroke="currentColor"
            strokeWidth="0.8"
            fill="none"
            className="text-black dark:text-white"
          />
        </g>

        {/* Bottom Left Circle - More Subtle */}
        <circle
          cx="280"
          cy="520"
          r="80"
          stroke="currentColor"
          strokeWidth="0.8"
          fill="none"
          className="text-black dark:text-white opacity-20 animate-pulse-slow"
        />

        {/* Right Circle Group - More Subtle */}
        <g className="animate-pulse-organic-delayed opacity-30">
          <circle
            cx="1000"
            cy="320"
            r="70"
            stroke="currentColor"
            strokeWidth="0.8"
            fill="none"
            className="text-black dark:text-white"
          />
          <circle
            cx="1020"
            cy="300"
            r="50"
            stroke="currentColor"
            strokeWidth="0.8"
            fill="none"
            className="text-black dark:text-white"
          />
          <circle
            cx="1040"
            cy="340"
            r="30"
            stroke="currentColor"
            strokeWidth="0.8"
            fill="none"
            className="text-black dark:text-white"
          />
          <circle
            cx="980"
            cy="350"
            r="35"
            stroke="currentColor"
            strokeWidth="0.8"
            fill="none"
            className="text-black dark:text-white"
          />
        </g>

        {/* Additional Mathematical Elements */}
        <g className="opacity-60">
          {/* Axis Labels */}
          <text
            x="1380"
            y="395"
            className="text-xs font-mono fill-black dark:fill-white opacity-60"
          >
            x
          </text>
          <text
            x="705"
            y="15"
            className="text-xs font-mono fill-black dark:fill-white opacity-60"
          >
            y
          </text>
        </g>
      </svg>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-mono font-normal text-black dark:text-white tracking-wide">
            private stargate finance
          </h1>
        </div>

        <div className="flex flex-col justify-center items-center md:flex-row gap-4">
          <Link to="/readings">
            <Button
              variant="outline"
              size="lg"
              className="bg-white dark:bg-black text-black dark:text-white border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-900 font-mono px-8 py-3 rounded-full min-w-[200px]"
            >
              learn more
            </Button>
          </Link>
          <Link to="/account">
            <Button
              variant="outline"
              size="lg"
              className="bg-white dark:bg-black text-black dark:text-white border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-900 font-mono px-8 py-3 rounded-full min-w-[200px]"
            >
              account
            </Button>
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes pulse-organic {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          25% {
            opacity: 0.6;
            transform: scale(1.02);
          }
          50% {
            opacity: 0.4;
            transform: scale(0.98);
          }
          75% {
            opacity: 0.7;
            transform: scale(1.01);
          }
        }

        @keyframes pulse-organic-delayed {
          0%,
          100% {
            opacity: 0.4;
            transform: scale(1);
          }
          30% {
            opacity: 0.7;
            transform: scale(1.03);
          }
          60% {
            opacity: 0.3;
            transform: scale(0.97);
          }
          90% {
            opacity: 0.6;
            transform: scale(1.02);
          }
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.6;
          }
        }

        @keyframes pulse-medium {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.7;
          }
        }

        .animate-pulse-organic {
          animation: pulse-organic 6s ease-in-out infinite;
        }

        .animate-pulse-organic-delayed {
          animation: pulse-organic-delayed 8s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-pulse-medium {
          animation: pulse-medium 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
