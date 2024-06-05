"use client";

import { Button } from "flowbite-react";
import { useRouter } from "next/navigation";
import { ImgComparisonSlider } from '@img-comparison-slider/react';
import Image from 'next/image';

export default function Home() {

  const router = useRouter();


  const gotoMakeup = () => {
    router.push('makeup');
  }

  return (
    <div className={`flex min-h-screen flex-col w-full p-2 bg-rose-200`}>
      <div className='font-bold text-4xl text-center text-black mb-10'>在线变装</div>
      <div className="w-full h-[50%] flex flex-col items-center">
        <h2 className="mb-4">上传一张人像照片，就可以开始神奇变化</h2>
        <div className={'relative w-[600px] h-[600px] flex items-center justify-center overflow-hidden'}>
          {/* 展示一些效果 demo, */}
          <ImgComparisonSlider className={'absolute top-0 left-0'}>
            <Image slot="first" alt='first' src="/examples/a.png" width={600} height={600} />
            <Image slot="second" alt='second' src="/out/out.png" width={600} height={600} />
          </ImgComparisonSlider>
        </div>

        <Button onClick={gotoMakeup} className="mt-5">动手试试</Button>
      </div>
    </div>
  );
}

