"use client";

import { Button } from "flowbite-react";
import { useRouter } from "next/navigation";


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
        {/* 展示一些效果 demo, */}
        <Button onClick={gotoMakeup}>去改造</Button>
      </div>
    </div>
  );
}

