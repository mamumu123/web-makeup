"use client";

import { useAssetData } from '@/hooks/useAssetDb';
import { Card } from 'flowbite-react';
import { useEffect, useRef, useState } from 'react';
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { BG_IMAGE, BG_TYPE } from '@/constants';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Table } from "flowbite-react";
import { changeHue, rgbToHsl } from '@/utils/color';
import { cn } from '@/lib/utils';

export default function Home() {
  const srcRef = useRef<HTMLImageElement>(null);
  const { mediaData, media } = useAssetData();

  const [loadImage, setLoadImage] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasInitRef = useRef<HTMLCanvasElement>(null);

  const [bgTypeHair, setBgTypeHair] = useState(BG_TYPE.OPACITY);
  const [colorHair, setColorHair] = useState('#FFFFFF');

  const [bgTypeLip, setBgTypeLip] = useState(BG_TYPE.OPACITY);
  const [colorLip, setColorLip] = useState('#FFFFFF');

  const [bgType, setBgType] = useState(BG_TYPE.INIT);
  const [color, setColor] = useState('#FFFFFF');
  const [bgIndex, setBgIndex] = useState(0);
  const bgRefs = useRef<any[]>([]);

  useEffect(() => {
    if (!mediaData || !loadImage || !canvasRef.current || !canvasInitRef.current) {
      return;
    }

    // console.log('mediaData', mediaData);

    const ctx = canvasRef.current?.getContext('2d', { willReadFrequently: true });
    const ctxInit = canvasInitRef.current?.getContext('2d', { willReadFrequently: true });
    if (!ctx || !ctxInit) {
      return
    }

    const {
      background, hair,
      l_lip: lowLip,
      u_lip: upLip,
    } = mediaData || {};
    const {
      data: dataBg,
      width,
      height,

    } = background;

    const { data: dataHair } = hair;

    canvasRef.current.width = width;
    canvasRef.current.height = height;
    ctx.drawImage(srcRef.current!, 0, 0, width, height);
    let imageData = ctx.getImageData(0, 0, width, height);
    let { data } = imageData || {};

    canvasInitRef.current.width = width;
    canvasInitRef.current.height = height;
    ctxInit.drawImage(srcRef.current!, 0, 0, width, height);
    let imageDataInit = ctxInit.getImageData(0, 0, width, height);

    if (bgType === BG_TYPE.OPACITY) {
      for (let index = 0; index < dataBg.length; index++) {
        if (dataBg[index] !== 0) {
          imageData.data[index * 4 + 3] = 0;
        }
      }
    }

    if (bgType === BG_TYPE.ONE) {
      for (let index = 0; index < dataBg.length; index++) {
        if (dataBg[index] !== 0) {
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          // 这个比较太慢了
          // const rgb = ColorLib(color).rgb().array();
          // const [r, g, b] = rgb;
          data[index * 4 + 0] = r;
          data[index * 4 + 1] = g;
          data[index * 4 + 2] = b;
        }
      }
    }

    if (bgType === BG_TYPE.IMAGE && bgRefs.current?.[bgIndex]) {

      // 画背景
      ctx.drawImage(bgRefs.current?.[bgIndex], 0, 0, width, height);
      imageData = ctx.getImageData(0, 0, width, height);
      data = imageData.data || {};

      for (let index = 0; index < dataBg.length; index++) {
        if (dataBg[index] === 0) {
          imageData.data[index * 4 + 0] = imageDataInit.data[index * 4 + 0];
          imageData.data[index * 4 + 1] = imageDataInit.data[index * 4 + 1];
          imageData.data[index * 4 + 2] = imageDataInit.data[index * 4 + 2];
        }
      }
    }

    if (bgTypeHair === BG_TYPE.ONE) {
      const color = colorHair;
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const hsl = rgbToHsl(r, g, b);
      const newHue = hsl[0];

      const data = dataHair;
      for (let index = 0; index < data.length; index++) {
        if (data[index] !== 0) {

          const newColor = changeHue([
            imageData.data[index * 4],
            imageData.data[index * 4 + 1],
            imageData.data[index * 4 + 2],
          ], newHue)
          imageData.data[index * 4 + 0] = newColor[0];
          imageData.data[index * 4 + 1] = newColor[1];
          imageData.data[index * 4 + 2] = newColor[2];
        }
      }
    }


    const { data: dataLowLip } = lowLip;
    const { data: dataUpLip } = upLip;
    if (bgTypeLip === BG_TYPE.ONE) {
      const color = colorLip;
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const hsl = rgbToHsl(r, g, b);
      const newHue = hsl[0];

      const data = dataHair;
      for (let index = 0; index < data.length; index++) {
        if (dataLowLip[index] !== 0 || dataUpLip[index] !== 0) {
          const newColor = changeHue([
            imageData.data[index * 4],
            imageData.data[index * 4 + 1],
            imageData.data[index * 4 + 2],
          ], newHue);
          imageData.data[index * 4 + 0] = newColor[0];
          imageData.data[index * 4 + 1] = newColor[1];
          imageData.data[index * 4 + 2] = newColor[2];
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [mediaData, loadImage,
    bgTypeHair, colorHair,
    colorLip, bgTypeLip,
    color, bgType, bgIndex
  ]);

  return (
    <div className={`flex h-full width-full  gap-10 flex-col`}>
      <div className='font-bold text-4xl text-center text-black'>在线变装</div>
      <div className='flex p-[6px] relative width-full  h-[600px] justify-between gap-10'>
        <Card className='flex-1 flex-col p-[6px] relative flex items-center justify-center'>
          <div className='text-center'>原图</div>
          {
            media?.url && (
              <Image ref={srcRef} src={media.url} width={512} height={512} alt='img' onLoad={() => setLoadImage(true)} priority />
            )}
        </Card>
        <Card className='flex-1 flex-col p-[6px] relative flex items-center justify-center'>
          <div className='text-center'>效果图</div>
          <canvas width={512} height={512} ref={canvasRef} className={'w-[512px] h-[512px]'}></canvas>
          <canvas width={512} height={512} ref={canvasInitRef} className={'w-[512px] h-[512px] hidden absolute'}></canvas>
        </Card>
      </div>
      <div className='width-full flex-1'>
        <Card className='flex flex-1'>
          {/* <div className={'flex'}> */}
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
                      {/* <input disabled={bgTypeHair !== BG_TYPE.ONE} value={colorHair} onChange={(e) => setColorHair(e.target.value)} type="color" id="colorHair" title="选择颜色" className="p-1 h-10 w-14 block bg-white border border-gray-200 cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700"></input> */}
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
                      {/* <input disabled={bgTypeLip !== BG_TYPE.ONE} value={colorLip} onChange={(event) => setColorLip(event.target.value)} type="color" id="color-lip" title="选择颜色" className="p-1 h-10 w-14 block bg-white border border-gray-200 cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700"></input> */}
                      <Input disabled={bgTypeLip !== BG_TYPE.ONE} value={colorLip} onChange={(event) => setColorLip(event.target.value)} type="color" id='color-lip'></Input>
                    </div>
                  </div>
                </Table.Cell>
              </Table.Row>
              <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                  {'背景颜色'}
                </Table.Cell>
                <Table.Cell>
                  <div >
                    <RadioGroup value={bgType} onValueChange={(value: BG_TYPE) => setBgType(value)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={BG_TYPE.INIT} id={BG_TYPE.INIT} />
                        <Label htmlFor={BG_TYPE.INIT}>原始背景</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={BG_TYPE.ONE} id={BG_TYPE.ONE} />
                        <Label htmlFor={BG_TYPE.ONE}>颜色背景</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={BG_TYPE.OPACITY} id={BG_TYPE.OPACITY} />
                        <Label htmlFor={BG_TYPE.OPACITY}>透明背景</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={BG_TYPE.IMAGE} id={BG_TYPE.IMAGE} />
                        <Label htmlFor={BG_TYPE.IMAGE}>图片背景</Label>
                      </div>
                    </RadioGroup>
                  </div >
                </Table.Cell>
                <Table.Cell>
                  <div className={'flex items-center'}>
                    <div className={'w-[200px] flex justify-around items-center'}>
                      <Label htmlFor="color-bg" className={'text-nowrap'}>背景色</Label>
                      {/* <input disabled={bgType !== BG_TYPE.ONE} value={color} onChange={(event) => setColor(event.target.value)} type="color" id="color-bg" title="选择颜色" className="p-1 h-10 w-14 block bg-white border border-gray-200 cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700"></input> */}
                      <Input disabled={bgType !== BG_TYPE.ONE} value={color} onChange={(event) => setColor(event.target.value)} type="color"></Input>
                    </div>
                    <div className={'flex flex-1 items-center gap-5'}>
                      {BG_IMAGE.map((it, index) => (
                        <div
                          key={it.url}
                          onClick={() => setBgIndex(index)}
                          className={cn('w-[100px] h-[100px] relative border-[5px] rounded-md', bgIndex === index ? 'border-teal-300' : '')}>
                          <Image
                            src={it.url}
                            // @ts-ignore
                            ref={el => bgRefs.current[index] = el}
                            style={{ objectFit: 'contain', fill: 'contain' }}
                            sizes="100%"
                            fill alt='bg' />
                        </div>
                      ))}
                    </div>
                  </div>
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
          {/* </div > */}
        </Card>
      </div>
    </div>
  );
}
