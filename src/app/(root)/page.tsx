"use client";

import { Button } from "flowbite-react";
import { useRouter } from "next/navigation";
import { ImgComparisonSlider } from '@img-comparison-slider/react';
import Image from 'next/image';
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations('Index');
  const router = useRouter();


  const gotoMakeup = () => {
    router.push('makeup');
  }

  return (
    <div className={`flex min-h-screen flex-col w-full p-2 bg-rose-200`}>
      <div className='font-bold text-4xl text-center text-black mb-10'>{t('title')}</div>
      <div className="w-full h-[50%] flex flex-col items-center">
        <h2 className="mb-4">{t('desc')}</h2>
        <div className={'relative w-[600px] h-[600px] flex items-center justify-center overflow-hidden'}>
          {/* 展示一些效果 demo, */}
          <ImgComparisonSlider className={'absolute top-0 left-0'}>
            <Image slot="first" alt='first' src="/examples/a.png" width={600} height={600} />
            <Image slot="second" alt='second' src="/out/out.png" width={600} height={600} />
          </ImgComparisonSlider>
        </div>

        <Button onClick={gotoMakeup} className="mt-5">{t('try-it')}</Button>
      </div>
    </div>
  );
}

