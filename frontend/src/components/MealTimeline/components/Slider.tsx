import React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

export const Slider: React.FC<SliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
}) => {
  return (
    <SliderPrimitive.Root
      className="relative flex items-center select-none touch-none w-full h-5"
      value={value}
      onValueChange={onChange as any}
      min={min}
      max={max}
      step={step}
      aria-label="Range"
    >
      <SliderPrimitive.Track className="bg-gray-200 relative grow rounded-full h-[3px]">
        <SliderPrimitive.Range className="absolute bg-blue-500 rounded-full h-full" />
      </SliderPrimitive.Track>
      {value.map((_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          className="block w-5 h-5 bg-white border-2 border-blue-500 rounded-full hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-colors"
        />
      ))}
    </SliderPrimitive.Root>
  );
};
