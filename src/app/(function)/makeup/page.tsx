"use client";

// import { useAssetData } from '@/hooks/useAssetDb';
import { Button, Card } from 'flowbite-react';
import { useEffect, useRef, useState, useMemo } from 'react';
import Image from "next/image";
import { Input } from "@/components/ui/input";
import {
  BG_TYPE, EXAMPLES
} from '@/constants';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Table } from "flowbite-react";
import { changeHue, rgbToHsl } from '@/utils/color';
import { cn } from '@/lib/utils';
import { pipeline, env, ImageSegmentationPipeline } from '@xenova/transformers';
import { formatData } from '@/utils/format';
env.allowLocalModels = false;

export default function Home() {
  const srcRef = useRef<HTMLImageElement>(null);
  // const { mediaData, media } = useAssetData();

  const [loadImage, setLoadImage] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasInitRef = useRef<HTMLCanvasElement>(null);

  const [demoIndex, setDemoIndex] = useState(0);

  const [exampleState, setExampleState] = useState(EXAMPLES);

  const imageDataResult = useMemo(() => {
    // TODO: if userUpload then
    return exampleState[demoIndex];
  }, [demoIndex, exampleState])


  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const segmenterRef = useRef<ImageSegmentationPipeline | null>(null)

  const handleClickDemo = async (index: number) => {
    const demo = exampleState[index];
    if (!demo.data) {
      await onTryDemo(index);
    }
    setDemoIndex(index);
  }

  useEffect(() => {
    async function loadingModel() {
      const segmenter = await pipeline('image-segmentation', 'jonathandinu/face-parsing');
      segmenterRef.current = segmenter;
      setReady(true);
    }
    loadingModel();
  })

  const onTryDemo = async (index: number) => {
    if (!segmenterRef.current) {
      console.error('segmenter failed')
      return
    }
    setLoading(true);
    const { url } = exampleState[index];
    try {
      const output = await segmenterRef.current(url);
      console.log('output end', output);
      const result = formatData(output);

      setExampleState((prev: any) => ({
        ...prev,
        [index]: {
          ...prev[index],
          data: result,
        }
      }))

      // const map: any = {}
      // Object.keys(output).forEach((key: any) => {
      //   const item = output[key];
      //   const { label, mask } = item;
      //   map[label] = mask;
      // });


      // await saveAsset({
      //   name: nanoid(),
      //   data: map,
      //   url: url,
      // });
    } catch (error) {
      console.error('onTry error', error)
    }
    setLoading(false);
  }

  const [bgTypeHair, setBgTypeHair] = useState(BG_TYPE.OPACITY);
  const [colorHair, setColorHair] = useState('#FFFFFF');

  const [bgTypeLip, setBgTypeLip] = useState(BG_TYPE.OPACITY);
  const [colorLip, setColorLip] = useState('#FFFFFF');

  // const [bgType, setBgType] = useState(BG_TYPE.INIT);
  // const [color, setColor] = useState('#FFFFFF');
  // const [bgIndex, setBgIndex] = useState(0);
  // const bgRefs = useRef<any[]>([]);

  useEffect(() => {
    if (!canvasRef.current || !canvasInitRef.current || !loadImage || !imageDataResult.data) {
      return;
    }

    const ctx = canvasRef.current?.getContext('2d', { willReadFrequently: true });
    // const ctxInit = canvasInitRef.current?.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return
    }

    const { width, height, url, data: resultData } = imageDataResult;
    if (!width || !height || !url) {
      return
    }

    // const {
    //   background, hair,
    //   l_lip: lowLip,
    //   u_lip: upLip,
    // } = mediaData || {};
    // const {
    //   data: dataBg,
    //   width,
    //   height,

    // } = background;

    // const { data: dataHair } = hair;

    canvasRef.current.width = width;
    canvasRef.current.height = height;
    ctx.drawImage(srcRef.current!, 0, 0, width, height);
    let imageData = ctx.getImageData(0, 0, width, height);

    // canvasInitRef.current.width = width;
    // canvasInitRef.current.height = height;
    // ctxInit.drawImage(srcRef.current!, 0, 0, width, height);
    // let imageDataInit = ctxInit.getImageData(0, 0, width, height);


    if (bgTypeHair === BG_TYPE.ONE) {
      const color = colorHair;
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const hsl = rgbToHsl(r, g, b);
      const newHue = hsl[0];
      const data: number[] = resultData.hairData;

      for (let index of data) {

        const newColor = changeHue(
          [
            imageData.data[index * 4],
            imageData.data[index * 4 + 1],
            imageData.data[index * 4 + 2]],
          newHue)
        imageData.data[index * 4 + 0] = newColor[0];
        imageData.data[index * 4 + 1] = newColor[1];
        imageData.data[index * 4 + 2] = newColor[2];
      }
    }

    if (bgTypeLip === BG_TYPE.ONE) {
      const color = colorLip;
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const hsl = rgbToHsl(r, g, b);
      const newHue = hsl[0];
      const data: number[] = resultData.lipData;
      for (let index of data) {

        const newColor = changeHue(
          [
            imageData.data[index * 4],
            imageData.data[index * 4 + 1],
            imageData.data[index * 4 + 2]],
          newHue)
        imageData.data[index * 4 + 0] = newColor[0];
        imageData.data[index * 4 + 1] = newColor[1];
        imageData.data[index * 4 + 2] = newColor[2];
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [
    imageDataResult,
    loadImage,
    bgTypeHair, colorHair,
    colorLip, bgTypeLip,
    // color, bgType, bgIndex
  ]);

  return (
    <div className={`flex h-full width-full  flex-col`}>
      <div className='font-bold text-4xl text-center text-black h-[50px]'>在线变装</div>
      <h2 className="mb-4 text-center  h-[20px]">上传一张人像照片，就可以开始神奇变化</h2>
      <div className='flex-1 flex p-[6px] relative width-full justify-between gap-10'>
        <Card className='flex-1 flex-col p-[6px] relative flex justify-center items-center'>
          <canvas width={512} height={512} ref={canvasRef} className={'w-[512px] h-[512px]'}></canvas>
          <canvas width={512} height={512} ref={canvasInitRef} className={'w-[512px] h-[512px] hidden absolute'}></canvas>
          {
            imageDataResult?.url && (
              <Image className={'absolute opacity-0 pointer-events-none'} ref={srcRef} src={imageDataResult.url} width={imageDataResult.width} height={imageDataResult.height} alt='img' onLoad={() => setLoadImage(true)} priority />
            )}
          {/* <Button onClick={() => onTryDemo(index)} disabled={!ready || loading} >
            生成数据
          </Button> */}
          <div>试试 demo </div>
          <div className='h-[100px] w-full flex  items-center gap-5 justify-start overflow-x-auto '>
            {exampleState.map((it, index) => (
              <div
                key={it.url}
                onClick={() => handleClickDemo(index)}
                className={cn('w-[100px] h-[100px] relative border-[5px] rounded-md', demoIndex === index ? 'border-teal-300' : '')}>
                <Image
                  src={it.url}
                  style={{ objectFit: 'contain', fill: 'contain' }}
                  sizes="100%"
                  fill alt='bg' />
              </div>
            ))}
          </div>

        </Card>

        <div className='flex-1 rounded-md'>
          <Table>
            <Table.Head>
              <Table.HeadCell>修改项</Table.HeadCell>
              <Table.HeadCell>操作栏</Table.HeadCell>
              <Table.HeadCell>操作详情</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                  {'头发颜色'}
                </Table.Cell>
                <Table.Cell>
                  <RadioGroup value={bgTypeHair} onValueChange={(it: BG_TYPE) => setBgTypeHair(it)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="opacity" id="opacity" />
                      <Label htmlFor="opacity">默认颜色</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="one" id="one" />
                      <Label htmlFor="one">颜色背景</Label>
                    </div>
                  </RadioGroup>
                </Table.Cell>
                <Table.Cell>
                  <div className={'flex items-center'}>
                    <div className={'w-[200px] flex justify-around items-center'}>
                      <Label htmlFor="colorHair" className={'text-nowrap'}>背景色</Label>
                      <Input disabled={bgTypeHair !== BG_TYPE.ONE} value={colorHair} onChange={(event) => setColorHair(event.target.value)} type="color"></Input>

                    </div>
                  </div>
                </Table.Cell>
              </Table.Row>
              <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                  {'口红颜色'}
                </Table.Cell>
                <Table.Cell>
                  <RadioGroup value={bgTypeLip} onValueChange={(value: BG_TYPE) => setBgTypeLip(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="opacity" id="opacity" />
                      <Label htmlFor="opacity">默认颜色</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="one" id="one" />
                      <Label htmlFor="one">颜色背景</Label>
                    </div>
                  </RadioGroup>
                </Table.Cell>
                <Table.Cell>
                  <div className={'flex items-center'}>
                    <div className={'flex justify-around items-center w-[200px]'}>
                      <Label htmlFor="color-lip" className={'text-nowrap'}>背景色</Label>
                      <Input disabled={bgTypeLip !== BG_TYPE.ONE} value={colorLip} onChange={(event) => setColorLip(event.target.value)} type="color" id='color-lip'></Input>
                    </div>
                  </div>
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
        </div>


      </div>

    </div >
  );
}
