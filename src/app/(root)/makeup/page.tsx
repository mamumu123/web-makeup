"use client";

import { Button, Card, Label, Spinner } from 'flowbite-react';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { BG_TYPE, CANVAS_STYLE, EXAMPLES, EXAMPLE_SECOND } from '@/constants';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table } from "flowbite-react";
import { changeHue, hexToHue } from '@/utils/color';
import { cn } from '@/lib/utils';
import { formatData } from '@/utils/format';
import { getImageSize, loadImage } from '@/utils';

import HAIR_DATA from '@/assets/json/hair.json';
import LIP_DATA from '@/assets/json/lip.json';
import { download } from '@/utils/download';
import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('Makeup');

  const workerRef = useRef<Worker | null>(null);
  const [result, setResult] = useState(null);
  const [ready, setReady] = useState(false);

  const [userUploadData, setUserLoaderData] = useState<{ width: number, height: number, url: string, data: any } | null>(null)

  useEffect(() => {
    const worker = new Worker(new URL('../../../worker/face-parse', import.meta.url), {
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

    // !say hello, loadModel
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
      const format = formatData(result);
      // @ts-ignore
      setUserLoaderData((pre) => ({
        ...pre,
        data: format,
      }))
      setLoading(false);

    }
  }, [result]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [demoIndex, setDemoIndex] = useState(0);

  const [exampleState, setExampleState] = useState(EXAMPLES);

  const imageDataResult = useMemo(() => {
    if (userUploadData?.data) {
      return userUploadData;
    }
    return exampleState[demoIndex];
  }, [demoIndex, exampleState, userUploadData])

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
    setUserLoaderData(null);
    setDemoIndex(index);
  }

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!ready) {
      console.error('model not ready');
      return
    }
    const file = event.target.files?.[0];

    if (!file) {
      console.error('error upload');
      return
    }
    const reader = new FileReader();

    reader.onloadend = async function () {
      var base64String = reader.result as string;
      setLoading(true);
      classify(base64String);
      const { width, height } = await getImageSize(base64String);
      setUserLoaderData({
        width,
        height,
        url: base64String,
        data: null,
      })
    }

    reader.readAsDataURL(file);
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
      console.time('render');

      const ctx = canvasRef.current?.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        console.error('ctx', ctx);
        return
      }
      canvasRef.current.style.width = `${width > height ? CANVAS_STYLE : CANVAS_STYLE * (width / height)}px`;
      canvasRef.current.style.height = `${height > width ? CANVAS_STYLE : CANVAS_STYLE * (width / height)}px`
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      const imageElement = await loadImage(url);
      ctx.drawImage(imageElement, 0, 0, width, height);
      let imageData = ctx.getImageData(0, 0, width, height);

      if (bgTypeHair === BG_TYPE.ONE) {
        const color = colorHair;
        const newHue = hexToHue(color);
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
        const newHue = hexToHue(color);
        const data: number[] = resultData.lipData;
        for (let index of data) {

          const newColor = changeHue(
            [
              imageData.data[index * 4],
              imageData.data[index * 4 + 1],
              imageData.data[index * 4 + 2]],
            newHue);
          imageData.data[index * 4 + 0] = newColor[0];
          imageData.data[index * 4 + 1] = newColor[1];
          imageData.data[index * 4 + 2] = newColor[2];
        }
      }
      ctx.putImageData(imageData, 0, 0);
      console.timeEnd('render');
    })()
  }, [
    imageDataResult,
    bgTypeHair, colorHair,
    colorLip, bgTypeLip,
  ]);

  return (
    <div className={`flex h-full width-full  flex-col`}>
      <div className='font-bold text-4xl text-center text-black h-[50px]'>{t('title')}</div>
      <h2 className="mb-4 text-center  h-[20px]">{t('desc')}</h2>

      <div className='flex-1 flex p-[6px] relative width-full justify-between gap-10 overflow-auto'>
        <Card className='flex-1 flex-col p-[6px] relative flex'>
          <div className={' h-[400px] w-full relative flex justify-center items-center'}>
            <canvas width={CANVAS_STYLE} height={CANVAS_STYLE} ref={canvasRef} className={'w-[400px] h-[400px]'}></canvas>
            {loading && <div className={'absolute top-0 left-0 flex flex-col bg-[#000000dd] items-center justify-center w-full h-full'}>
              <Spinner aria-label="Default status example" size={'xl'} />
              <div className={'mt-2 text-lg'}>{t('dealing')}</div>
            </div>
            }
          </div>
          <div className='w-full relative flex justify-between items-center'>
            <Input disabled={!ready || loading} type="file" className='h-[60px] flex-1' onChange={handleMediaChange} accept='image/*' />
            <Button className='flex-1' disabled={!ready || loading} onClick={() => download(canvasRef)}>{t('download')}</Button>
          </div>

          <div>{t('try-it')} </div>
          <div className='h-[100px] w-full flex  items-center gap-5 justify-start overflow-x-auto '>
            {exampleState.map((it, index) => (
              <div
                key={it.url}
                onClick={() => handleClickDemo(index)}
                className={cn('w-[100px] h-[100px] relative border-[5px] rounded-md', demoIndex === index ? 'border-teal-300' : '', (loading || !it.data) ? 'pointer-events-none' : 'pointer-events-auto')}>
                <Image
                  src={it.url}
                  style={{ objectFit: 'contain', fill: 'contain' }}
                  sizes="100%"
                  fill alt='bg' />
                {!it.data && <div className={'absolute top-0 left-0 flex flex-col bg-[#000000dd] items-center justify-center w-full h-full'}>
                  <Spinner aria-label="Default status example" size={'lg'} />
                </div>
                }
              </div>
            ))}
          </div>

        </Card>

        <div className='flex-1 rounded-md overflow-y-auto'>
          <Table>
            <Table.Head>
              <Table.HeadCell>{t('table-modify')}</Table.HeadCell>
              <Table.HeadCell>{t('table-op')}</Table.HeadCell>
              <Table.HeadCell>{t('table-detail')}</Table.HeadCell>
              <Table.HeadCell>{t('table-custom')}</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                  {t('hair-color')}
                </Table.Cell>
                <Table.Cell>
                  <RadioGroup value={bgTypeHair} onValueChange={(it: BG_TYPE) => setBgTypeHair(it)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="opacity" id="opacity" />
                      <Label htmlFor="opacity">{t('default-color')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="one" id="one" />
                      <Label htmlFor="one">{t('custom-color')}</Label>
                    </div>
                  </RadioGroup>
                </Table.Cell>
                <Table.Cell className={'flex-1'}>
                  <div className={'overflow-x-auto flex items-center flex-wrap flex-1'}>
                    {HAIR_DATA.slice(0, 40).map((item) => (
                      <Button key={item}
                        disabled={bgTypeHair !== BG_TYPE.ONE}
                        size={'xs'}
                        onClick={() => setColorHair(item)}
                        style={{ backgroundColor: item }} >{item}</Button>
                    ))}
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div className={'flex flex-col justify-around  items-center'}>
                    <Label htmlFor="colorHair" className={'text-nowrap'}>{colorHair}</Label>
                    <input className='width-[50px]' disabled={bgTypeHair !== BG_TYPE.ONE} value={colorHair} onChange={(event) => setColorHair(event.target.value)} type="color" />
                  </div>
                </Table.Cell>
              </Table.Row>
              <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                  {t('lip-color')}
                </Table.Cell>
                <Table.Cell>
                  <RadioGroup value={bgTypeLip} onValueChange={(value: BG_TYPE) => setBgTypeLip(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="opacity" id="opacity" />
                      <Label htmlFor="opacity">{t('default-color')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="one" id="one" />
                      <Label htmlFor="one">{t('custom-color')}</Label>
                    </div>
                  </RadioGroup>
                </Table.Cell>
                <Table.Cell className={'flex-1'}>
                  <div className={'overflow-x-auto flex items-center flex-wrap flex-1'}>
                    {LIP_DATA.map((item) => (
                      <Button key={item.color}
                        size={'xs'}
                        disabled={bgTypeLip !== BG_TYPE.ONE}
                        onClick={() => setColorLip(item.color)}
                        style={{ backgroundColor: item.color }} >{item.color}</Button>
                    ))}
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div className={'flex flex-col justify-center items-center '}>
                    <Label htmlFor="color-lip" className={'text-nowrap'}>{colorLip}</Label>
                    <input className='width-[50px]' disabled={bgTypeLip !== BG_TYPE.ONE} value={colorLip} onChange={(event) => setColorLip(event.target.value)} type="color" id='color-lip' />
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
