"use client";

import { useAssetData } from '@/hooks/useAssetDb';
import { Card } from 'flowbite-react';
import { useEffect, useRef } from 'react';
import Image from "next/image";
import { loaderProp } from '@/utils/image';

export default function Home() {
  const srcRef = useRef<HTMLImageElement>(null);
  const { mediaData, media } = useAssetData();
  console.log('media', media);
  useEffect(() => {
    if (mediaData) {
      console.log('mediaData', mediaData);
    }

  }, [mediaData])

  return (
    <div className={`flex h-full width-full  p-12 gap-10`}>
      <Card className='flex-1 flex-col'>
        <div className='flex w-[512px] h-[512px] items-center justify-center'>
          {
            media?.url && (
              <Image ref={srcRef} src={media.url} width={512} height={512} alt='img' loader={loaderProp} />
            )}
        </div>

      </Card>
      <Card className='flex-1'>

      </Card>
    </div>
  );
}
