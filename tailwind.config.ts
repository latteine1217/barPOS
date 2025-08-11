import forms from '@tailwindcss/forms'
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 啟用基於 class 的深色模式
  theme: {
    extend: {
      colors: {
        // 現代調酒酒吧色彩系統 - 更豐富的漸變配色
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // 現代酒吧品牌色 - 深邃夜空藍
        bar: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // 現代金色系 - 香檳金與玫瑰金
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // 現代紫羅蘭色系 - 神秘夜色
        violet: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        // 現代青綠色系 - 冰晶效果
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        // 琥珀色 - 威士忌色調
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // 基酒專屬色彩
        spirit: {
          gin: '#e0f2fe',        // 清淡藍色 - 琴酒
          'gin-dark': '#0369a1', 
          whisky: '#fef3c7',     // 琥珀色 - 威士忌
          'whisky-dark': '#92400e',
          rum: '#fde68a',        // 金黃色 - 蘭姆酒
          'rum-dark': '#a16207',
          tequila: '#ecfdf5',    // 淡綠色 - 龍舌蘭
          'tequila-dark': '#065f46',
          vodka: '#f8fafc',      // 純淨白 - 伏特加
          'vodka-dark': '#334155',
          brandy: '#fed7aa',     // 橙棕色 - 白蘭地
          'brandy-dark': '#9a3412',
          others: '#f3e8ff',     // 紫色 - 其他
          'others-dark': '#6b21a8',
        },
        secondary: '#64748b',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'inter': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        // 經典酒吧漸變
        'bar-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        'gold-gradient': 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
        'amber-gradient': 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 50%, #b45309 100%)',
        'night-gradient': 'linear-gradient(135deg, #020617 0%, #0f172a 25%, #1e293b 75%, #334155 100%)',
        
        // 現代玻璃折射漸變背景
        'glass-aurora': 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
        'glass-sunset': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 25%, #fecfef 50%, #c471f5 75%, #fa71cd 100%)',
        'glass-ocean': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 25%, #d3959b 50%, #bfe9ff 75%, #00d2ff 100%)',
        'glass-cosmic': 'linear-gradient(135deg, #667eea 0%, #764ba2 20%, #f093fb 40%, #f5576c 60%, #4facfe 80%, #00f2fe 100%)',
        'glass-emerald': 'linear-gradient(135deg, #11998e 0%, #38ef7d 25%, #667eea 50%, #764ba2 75%, #f093fb 100%)',
        
        // 高端漸變背景 - 玻璃反射效果
        'luxury-gold': 'linear-gradient(135deg, #ffd89b 0%, #19547b 25%, #ffd89b 50%, #667eea 75%, #f093fb 100%)',
        'luxury-silver': 'linear-gradient(135deg, #e8e8e8 0%, #2196f3 25%, #21cbf3 50%, #c4c5c5 75%, #9b9b9b 100%)',
        'luxury-bronze': 'linear-gradient(135deg, #cd7f32 0%, #fbbf24 25%, #fb923c 50%, #f59e0b 75%, #92400e 100%)',
        
        // 動態反射漸變 - 用於玻璃面板
        'glass-reflection-1': 'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%, transparent 100%)',
        'glass-reflection-2': 'linear-gradient(135deg, rgba(138, 43, 226, 0.1) 0%, rgba(30, 144, 255, 0.1) 25%, rgba(255, 20, 147, 0.1) 50%, rgba(255, 165, 0, 0.1) 75%, rgba(50, 205, 50, 0.1) 100%)',
        'glass-reflection-3': 'linear-gradient(225deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 69, 0, 0.1) 25%, rgba(138, 43, 226, 0.1) 50%, rgba(0, 191, 255, 0.1) 75%, rgba(50, 205, 50, 0.1) 100%)',
        
        // 主背景漸變系統
        'app-bg-light': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 25%, #f1f5f9 50%, #cbd5e1 75%, #94a3b8 100%)',
        'app-bg-dark': 'linear-gradient(135deg, #020617 0%, #0f172a 20%, #1e293b 40%, #334155 60%, #475569 80%, #64748b 100%)',
        
        // 玻璃材質背景 - 不同透明度和色調
        'glass-bg-1': 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)',
        'glass-bg-2': 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
        'glass-bg-dark-1': 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,41,59,0.85) 100%)',
        'glass-bg-dark-2': 'linear-gradient(135deg, rgba(30,41,59,0.75) 0%, rgba(51,65,85,0.75) 100%)',
        
        // 彩虹折射效果
        'rainbow-glass': 'linear-gradient(135deg, rgba(255,0,150,0.1) 0%, rgba(255,0,0,0.1) 14%, rgba(255,127,0,0.1) 28%, rgba(255,255,0,0.1) 42%, rgba(0,255,0,0.1) 57%, rgba(0,0,255,0.1) 71%, rgba(75,0,130,0.1) 85%, rgba(148,0,211,0.1) 100%)',
      },
      boxShadow: {
        'bar': '0 4px 25px rgba(15, 23, 42, 0.15)',
        'bar-lg': '0 8px 40px rgba(15, 23, 42, 0.2)',
        'gold': '0 4px 25px rgba(245, 158, 11, 0.25)',
        'gold-lg': '0 8px 40px rgba(245, 158, 11, 0.35)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.4)',
        'glow-gold': '0 0 20px rgba(245, 158, 11, 0.4)',
        
        // 現代玻璃質感陰影
        'glass': '0 8px 32px rgba(31, 38, 135, 0.37)',
        'glass-lg': '0 16px 64px rgba(31, 38, 135, 0.37)',
        'glass-inset': 'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        'glass-border': '0 0 0 1px rgba(255, 255, 255, 0.1)',
        
        // 彩色發光效果
        'glow-purple': '0 0 30px rgba(168, 85, 247, 0.4)',
        'glow-pink': '0 0 30px rgba(236, 72, 153, 0.4)',
        'glow-cyan': '0 0 30px rgba(34, 211, 238, 0.4)',
        'glow-emerald': '0 0 30px rgba(16, 185, 129, 0.4)',
        'glow-amber': '0 0 30px rgba(245, 158, 11, 0.4)',
        
        // 多層玻璃效果
        'glass-multi': '0 8px 32px rgba(31, 38, 135, 0.37), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        'glass-hover': '0 16px 64px rgba(31, 38, 135, 0.37), inset 0 2px 0 rgba(255, 255, 255, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.15)',
        
        // 反射效果陰影
        'reflection': '0 0 50px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        'reflection-strong': '0 0 80px rgba(255, 255, 255, 0.2), inset 0 2px 0 rgba(255, 255, 255, 0.3)',
      },
      
      // 新增動畫配置
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glass-shine': 'glass-shine 3s ease-in-out infinite',
        'reflection-sweep': 'reflection-sweep 4s ease-in-out infinite',
        'color-shift': 'color-shift 10s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 8s ease-in-out infinite',
        'bubble-1': 'bubble-float 20s ease-in-out infinite',
        'bubble-2': 'bubble-float 25s ease-in-out infinite reverse',
        'bubble-3': 'bubble-float 30s ease-in-out infinite',
        'bubble-4': 'bubble-float 35s ease-in-out infinite reverse',
        'bubble-5': 'bubble-float 40s ease-in-out infinite',
      },
      
      // 新增 keyframes
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)' },
          '100%': { boxShadow: '0 0 40px rgba(255, 255, 255, 0.3)' },
        },
        'glass-shine': {
          '0%': { 
            backgroundPosition: '-200% 0',
            opacity: '0'
          },
          '50%': { 
            opacity: '1'
          },
          '100%': { 
            backgroundPosition: '200% 0',
            opacity: '0'
          },
        },
        'reflection-sweep': {
          '0%': { transform: 'translateX(-100%) skewX(-15deg)' },
          '100%': { transform: 'translateX(200%) skewX(-15deg)' },
        },
        'color-shift': {
          '0%': { filter: 'hue-rotate(0deg)' },
          '25%': { filter: 'hue-rotate(90deg)' },
          '50%': { filter: 'hue-rotate(180deg)' },
          '75%': { filter: 'hue-rotate(270deg)' },
          '100%': { filter: 'hue-rotate(360deg)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-30px) rotate(120deg)' },
          '66%': { transform: 'translateY(-20px) rotate(240deg)' },
        },
        'bubble-float': {
          '0%': { 
            transform: 'translateY(0px) translateX(0px) scale(1)',
            opacity: '0.7'
          },
          '25%': { 
            transform: 'translateY(-50px) translateX(30px) scale(1.1)',
            opacity: '0.8'
          },
          '50%': { 
            transform: 'translateY(-20px) translateX(-20px) scale(0.9)',
            opacity: '0.6'
          },
          '75%': { 
            transform: 'translateY(-40px) translateX(40px) scale(1.05)',
            opacity: '0.9'
          },
          '100%': { 
            transform: 'translateY(0px) translateX(0px) scale(1)',
            opacity: '0.7'
          },
        },
      },
      
      // 新增模糊效果
      backdropBlur: {
        'xs': '2px',
        'xl': '24px',
        '2xl': '40px',
        '3xl': '64px',
      }
    },
  },
  plugins: [
    forms,
  ],
}

export default config