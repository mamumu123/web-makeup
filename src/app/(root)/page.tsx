"use client";

import { UploadImage } from "@/components/shared/upload";
import { EXAMPLES } from "@/constants";
import { loaderProp } from "@/utils/image";
import { Button, Card } from "flowbite-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { pipeline, env, ImageSegmentationPipeline } from '@xenova/transformers';
import { nanoid } from "nanoid";

env.allowLocalModels = false;

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const segmenterRef = useRef<ImageSegmentationPipeline | null>(null)

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
      saveAsset(nanoid(), map);
    } catch (error) {
      console.error('onTry error', error)
    }
    setLoading(false);
  }

  useEffect(() => {
    async function loadingModel() {
      const segmenter = await pipeline('image-segmentation', 'Xenova/face-parsing');
      segmenterRef.current = segmenter;
      setReady(true);
    }
    loadingModel();


  })

  return (
    <div className={`flex min-h-screen flex-col w-full p-2 `}>
      <div className="w-full h-[50%] flex flex-col items-center">
        <h2 className="mb-4">上传一张人像照片，就可以开始神奇变化</h2>
        <div className={'w-[60%]'}>
          <UploadImage />
        </div>
        <div className={'mt-5 mb-5'}>
          使用 examples 中的图片试试看
        </div>
        <div className="flex flex-row w-full justify-center">
          {EXAMPLES.map((item, index) => (
            <Card key={index} className={'w-[220px] h-[200px] relative'}>
              <div className={'w-[200] h-[200px] relative'}>
                <Image layout='fill' objectFit='contain' src={item.url} alt='img' loader={loaderProp} />
              </div>
              <Button disabled={loading || !ready} onClick={() => onTry(item.url)}> 试一下 </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>

  );
}
function saveAsset(arg0: string, map: any) {
  throw new Error("Function not implemented.");
}

