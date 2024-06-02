"use client";

import { useAssetData } from '@/hooks/useAssetDb';
import { Card } from 'flowbite-react';
import { useEffect, useRef, useState } from 'react';
import Image from "next/image";
import { loaderProp } from '@/utils/image';
import { BG_TYPE } from '@/constants';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table } from "flowbite-react";
import { changeHue, rgbToHsl } from '@/utils/color';

export default function Home() {
  const srcRef = useRef<HTMLImageElement>(null);
  const { mediaData, media } = useAssetData();

  const [loadImage, setLoadImage] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [bgTypeHair, setBgTypeHair] = useState(BG_TYPE.OPACITY);
  const [colorHair, setColorHair] = useState('#000000');

  const [bgTypeLip, setBgTypeLip] = useState(BG_TYPE.OPACITY);
  const [colorLip, setColorLip] = useState('#000000');

  const [bgType, setBgType] = useState(BG_TYPE.RANDOM);
  const [color, setColor] = useState('#000000');

  useEffect(() => {
    if (!mediaData || !loadImage || !canvasRef.current) {
      return;
    }

    console.log('mediaData', mediaData);

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) {
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

    const imageData = ctx.getImageData(0, 0, width, height);
    const { data } = imageData || {};

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
    color, bgType
  ]);

  return (
    <div className={`flex h-full width-full  gap-10 flex-col`}>
      <div className='flex p-[6px] relative width-full  h-[600px] justify-between'>
        <Card className='flex-1 flex-col p-[6px] relative flex items-center justify-center'>
          <div className='text-center'>原图</div>
          {
            media?.url && (
              <Image ref={srcRef} src={media.url} width={512} height={512} alt='img' loader={loaderProp} onLoad={() => setLoadImage(true)} />
            )}
        </Card>
        <Card className='flex-1 flex-col p-[6px] relative flex items-center justify-center'>
          <div className='text-center'>效果图</div>
          <canvas width={512} height={512} ref={canvasRef} className={'w-[512px] h-[512px]'}></canvas>
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
                  <div className={'w-[200px] ml-[48px]'}>{
                    (bgTypeHair === BG_TYPE.ONE) && (
                      <div className={'flex justify-around items-center'}>
                        <Label htmlFor="color" className={'text-nowrap'}>背景色</Label>
                        <Input value={colorHair} onChange={(event) => setColorHair(event.target.value)} type="color"></Input>
                      </div>
                    )}
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
                  <div className={'w-[200px] ml-[48px]'}>{
                    (bgTypeLip === BG_TYPE.ONE) && (
                      <div className={'flex justify-around items-center'}>
                        <Label htmlFor="color" className={'text-nowrap'}>背景色</Label>
                        <Input value={colorLip} onChange={(event) => setColorLip(event.target.value)} type="color"></Input>
                      </div>
                    )}
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
                        <RadioGroupItem value="random" id="random" />
                        <Label htmlFor="random">原始背景</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="one" id="one" />
                        <Label htmlFor="one">颜色背景</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="opacity" id="opacity" />
                        <Label htmlFor="opacity">透明背景</Label>
                      </div>
                    </RadioGroup>
                  </div >
                </Table.Cell>
                <Table.Cell>
                  {
                    (bgType === BG_TYPE.ONE) && (
                      <div className={'flex justify-around items-center'}>
                        <Label htmlFor="color" className={'text-nowrap'}>背景色</Label>
                        <Input value={color} onChange={(event) => setColor(event.target.value)} type="color"></Input>
                      </div>
                    )}
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
