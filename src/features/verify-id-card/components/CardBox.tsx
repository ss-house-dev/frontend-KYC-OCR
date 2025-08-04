import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Camera, ChevronRight } from 'lucide-react'; // or your icon library


interface CardBoxProps {
  onClick: () => void;
  title: string;
  description: string;
  // รับ Icon เข้ามาเป็น Component Type
  icon: React.ElementType;
}

export function CardBox({ onClick, title, description, icon: IconComponent, }: CardBoxProps) {
  return (
            <Card 
            onClick={(onClick)}
            className="p-4 flex items-center space-x-6 cursor-pointer hover:bg-gray-100/70 transition duration-200">
              <div className="bg-gradient-to-t from-[#1F4293] to-[#246AEC] p-4 rounded-lg">
                <IconComponent className="w-8 h-8 text-white " />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-base sm:text-lg text-[#1C55D9]">{title}</h2>
                <p className="text-xs sm:text-sm text-gray-500">{description}</p>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </Card>
  );
}