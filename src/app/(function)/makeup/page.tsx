"use client";

import { Button, Card, Spinner } from 'flowbite-react';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { BG_TYPE, EXAMPLES, EXAMPLE_SECOND } from '@/constants';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Table } from "flowbite-react";
import { changeHue, rgbToHsl } from '@/utils/color';
import { cn } from '@/lib/utils';
import { formatData } from '@/utils/format';
import { loadImage } from '@/utils';

export default function Home() {
  const workerRef = useRef<Worker | null>(null);
  const [result, setResult] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const worker = new Worker(new URL('../../worker/face-parse', import.meta.url), {
      type: 'module'
    });

    worker.onmessage = (e: MessageEvent) => {
      // console.log('onMessageReceived', e);
      switch (e.data.status) {
        case 'initiate':
          setReady(false);
          break;
        case 'ready':
          setReady(true);
          break;
        case 'complete':
          setResult(e.data.output)
          break;
      }
    };

    worker.onerror = (event) => {
      if (event instanceof Event) {
        console.log('🍎 Error message received from worker: ', event);
        return event;
      }

      console.log('🍎 Unexpected error: ', event);
      throw event;
    };

    // say hello, loadData
    worker.postMessage({});
    workerRef.current = worker;
    return () => {
      worker.terminate();
    };
  }, []);

  const classify = useCallback((url: string) => {
    workerRef.current?.postMessage({ url });
  }, []);

  useEffect(() => {
    if (result) {
      console.log('result', result);
      const format = formatData(result);
      console.log('format', format);
    }
  }, [result]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [demoIndex, setDemoIndex] = useState(0);

  const [exampleState, setExampleState] = useState(EXAMPLES);

  const imageDataResult = useMemo(() => {
    // TODO: if userUpload then
    return exampleState[demoIndex];
  }, [demoIndex, exampleState])

  useEffect(() => {
    function loadExamples() {
      EXAMPLE_SECOND.forEach((item) => {
        fetch(item.dataJson)
          .then(response => response.json())
          .then((result) => {
            setExampleState((prev: any) => {
              const temp = prev;
              temp[item.index] = result;
              return temp;
            })
          })
      })
    }

    loadExamples();
  }, []);

  const [loading, setLoading] = useState(false);

  const handleClickDemo = async (index: number) => {
    const demo = exampleState[index];
    if (!demo.data) {
      return;
    }
    setDemoIndex(index);
  }


  const onTryDemo = async (index: number) => {
    if (!ready) {
      console.error('model not ready');
      return
    }
    setLoading(true);
    const { url } = exampleState[index];
    try {
      classify(url);

      //     setExampleState((prev: any) => {
      //       const temp = prev;
      //       temp[index] = {
      //         ...prev[index],
      //         data: result,
      //       }

      //       return temp;
      //     })


      //     // const map: any = {}
      //     // Object.keys(output).forEach((key: any) => {
      //     //   const item = output[key];
      //     //   const { label, mask } = item;
      //     //   map[label] = mask;
      //     // });


      //     // await saveAsset({
      //     //   name: nanoid(),
      //     //   data: map,
      //     //   url: url,
      //     // });
    } catch (error) {
      console.error('onTry error', error)
    }
    setLoading(false);
  }

  const [bgTypeHair, setBgTypeHair] = useState(BG_TYPE.OPACITY);
  const [colorHair, setColorHair] = useState('#FFFFFF');

  const [bgTypeLip, setBgTypeLip] = useState(BG_TYPE.OPACITY);
  const [colorLip, setColorLip] = useState('#FFFFFF');

  useEffect(() => {

    (async () => {
      const { width, height, url, data: resultData } = imageDataResult;

      if (!canvasRef.current || !resultData || !width || !height || !url) {
        console.error('canvasRef', canvasRef.current, 'resultData', resultData, 'width', width, 'height', height, 'url', url);
        return;
      }

      const ctx = canvasRef.current?.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        console.error('ctx', ctx);
        return
      }

      canvasRef.current.width = width;
      canvasRef.current.height = height;
      const imageElement = await loadImage(url);
      ctx.drawImage(imageElement, 0, 0, width, height);
      let imageData = ctx.getImageData(0, 0, width, height);

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
    })()
  }, [
    imageDataResult,
    bgTypeHair, colorHair,
    colorLip, bgTypeLip,
  ]);

  console.log('imageDataResult', imageDataResult);

  return (
    <div className={`flex h-full width-full  flex-col`}>
      <div className='font-bold text-4xl text-center text-black h-[50px]'>在线变装</div>
      <h2 className="mb-4 text-center  h-[20px]">上传一张人像照片，就可以开始神奇变化</h2>
      <div className='flex-1 flex p-[6px] relative width-full justify-between gap-10'>
        <Card className='flex-1 flex-col p-[6px] relative flex justify-center items-center'>
          <canvas width={512} height={512} ref={canvasRef} className={'w-[512px] h-[512px]'}></canvas>
          <Button onClick={() => onTryDemo(demoIndex)} disabled={!ready || loading} >
            {ready ? '生成数据' : '模型加载中'}
          </Button>
          <div>试试 demo </div>
          <div className='h-[100px] w-full flex  items-center gap-5 justify-start overflow-x-auto '>
            {exampleState.map((it, index) => (
              <div
                key={it.url}
                onClick={() => handleClickDemo(index)}
                className={cn('w-[100px] h-[100px] relative border-[5px] rounded-md', demoIndex === index ? 'border-teal-300' : '', !it.data ? 'pointer-events-none' : 'pointer-events-auto')}>
                <Image
                  src={it.url}
                  style={{ objectFit: 'contain', fill: 'contain' }}
                  sizes="100%"
                  fill alt='bg' />
                {
                  !it.data && (
                    <Spinner aria-label="Default status example" size={'lg'} className={'absolute top-[30%] left-[30%] '} />
                  )
                }
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
