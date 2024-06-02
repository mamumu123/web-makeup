"use client";

import { UploadImage } from "@/components/shared/upload";
import { EXAMPLES } from "@/constants";
import { loaderProp } from "@/utils/image";
import { Button, Card } from "flowbite-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { pipeline, env, ImageSegmentationPipeline } from '@xenova/transformers';
import { nanoid } from "nanoid";
import { useAssetData } from "@/hooks/useAssetDb";
import { useRouter } from "next/navigation";

env.allowLocalModels = false;

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const segmenterRef = useRef<ImageSegmentationPipeline | null>(null)

  const { saveAsset } = useAssetData();
  const router = useRouter();


  const onTry = async (url: string) => {
    if (!segmenterRef.current) {
      console.error('segmenter failed')
      return
    }
    setLoading(true);

    try {
      const output = await segmenterRef.current(url);
      console.log('output end', output);
      const map: any = {}
      Object.keys(output).forEach((key: any) => {
        const item = output[key];
        const { label, mask } = item;
        map[label] = mask;
      });
      await saveAsset({
        name: nanoid(),
        data: map,
        url: url,
      });
      router.push('makeup');
    } catch (error) {
      console.error('onTry error', error)
    }
    setLoading(false);
  }

  useEffect(() => {
    async function loadingModel() {
      const segmenter = await pipeline('image-segmentation', 'jonathandinu/face-parsing');
      segmenterRef.current = segmenter;
      setReady(true);
    }
    loadingModel();
  })

  return (
    <div className={`flex min-h-screen flex-col w-full p-2 bg-rose-200`}>
      <div className='font-bold text-4xl text-center text-black mb-10'>在线变装</div>
      <div className="w-full h-[50%] flex flex-col items-center">
        <h2 className="mb-4">上传一张人像照片，就可以开始神奇变化</h2>
        <div className={'w-[60%]'}>
          <UploadImage />
        </div>
        <div className={'mt-5 mb-5'}>
          使用 examples 中的图片试试看
        </div>
        <div className="flex flex-row w-full justify-center gap-5">
          {EXAMPLES.map((item, index) => (
            <Card key={index} className={'w-[220px] h-[200px] relative'}>
              <div className={'w-[200] h-[200px] relative'}>
                <Image fill style={{ objectFit: 'contain', fill: 'contain' }} src={item.url} alt='img' loader={loaderProp} priority />
              </div>
              <Button disabled={loading || !ready} onClick={() => onTry(item.url)}> 试一下 </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

