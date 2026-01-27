import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw, Zap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  progress: number;
  onSeek: (val: number) => void;
  speed: number;
  onSpeedChange: () => void;
}

export function PlaybackControls({ 
  isPlaying, onPlayPause, onReset, progress, onSeek, speed, onSpeedChange 
}: PlaybackControlsProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="bg-slate-900/90 backdrop-blur-xl text-white rounded-full p-3 shadow-2xl flex items-center gap-4 border border-slate-700/50 ring-1 ring-black/5 mx-auto max-w-[600px] hover:scale-[1.01] transition-transform duration-300">
        
        {/* Play/Pause Main Button */}
        <Button 
          size="icon" 
          className={`h-10 w-10 rounded-full shrink-0 transition-all ${
             isPlaying 
             ? "bg-amber-500 hover:bg-amber-600 text-black" 
             : "bg-white hover:bg-blue-50 text-blue-600"
          }`}
          onClick={onPlayPause}
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
        </Button>

        {/* Reset */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onReset} className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 rounded-full shrink-0">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-black text-xs">Reiniciar</TooltipContent>
        </Tooltip>

        {/* Slider - Custom Styled */}
        <div className="flex-1 px-2 group">
          <Slider 
            value={[progress]} 
            max={100} 
            step={0.1} 
            onValueChange={(vals) => onSeek(vals[0])}
            className="cursor-pointer py-2"
          />
        </div>

        {/* Speed Selector */}
        <div className="flex items-center border-l border-white/10 pl-4">
             <Button 
                variant="ghost" 
                size="sm" 
                onClick={onSpeedChange} 
                className="h-8 px-2 text-xs font-mono font-bold text-blue-300 hover:text-white hover:bg-white/10 rounded-md"
             >
                <Zap className="w-3 h-3 mr-1" /> {speed}x
             </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}