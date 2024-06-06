

## 声明
项目声明：本项目为纯前端实现，所有用户上传的图片均在用户本地进行处理，无需担心安全问题。

## 效果展示

![截屏2024-06-05 21.21.58.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c9cc23f764164ffb993b4ef535c454eb~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=3340&h=1796&s=1980350&e=png&b=faf6f6)

## 体验地址
https://web-makeup.vercel.app/makeup

## 源码地址

https://github.com/mamumu123/web-makeup

## 项目介绍
本项目实现了换头发颜色和口红颜色的功能，特点是纯前端能力，不需要服务器支持，具有安全性。

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

## Deploy on Vercel
如果你没有自己的服务端，你可以免费的部署在 vercel 上。


## 技术细节

### 如何识别到头发和嘴唇的位置

在网上寻找以后，找到了一个现成的模型，可以识别出头发和嘴唇的位置。
[Xenova/face-parsing](https://huggingface.co/Xenova/face-parsing)

在前端使用模型能力，比较简单。最简化的代码，就是下面这几行。
```js
import { pipeline } from '@xenova/transformers';

const segmenter = await pipeline('image-segmentation', 'Xenova/face-parsing');

const url = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/portrait-of-woman.jpg';
const output = await segmenter(url);
console.log(output)
```

如果你想在线尝试这个模型能力，可以在这个界面的右侧进行尝试。[jonathandinu/face-parsing](https://huggingface.co/jonathandinu/face-parsing)。


#### 配置 webpack ,忽略一些 node 模块
(下文是 transformers.js 文档提供的参考）
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
    // (Optional) Export as a static site
    // See https://nextjs.org/docs/pages/building-your-application/deploying/static-exports#configuration
    output: 'export', // Feel free to modify/remove this option

    // Override the default webpack configuration
    webpack: (config) => {
        // See https://webpack.js.org/configuration/resolve/#resolvealias
        config.resolve.alias = {
            ...config.resolve.alias,
            "sharp$": false,
            "onnxruntime-node$": false,
        }
        return config;
    },
}

module.exports = nextConfig
```

#### 将模型的加载放置在 worker 中
由于模型比较大，在加载的过程中，会导致项目卡住，非常影响使用体验。放在 worker 中，等到ready 以后，再更新状态，会更合适。

```js
useEffect(() => {
    if (!worker.current) {
      // Create the worker if it does not yet exist.
      worker.current = new Worker(new URL('./worker.js', import.meta.url), {
        type: 'module'
      });
    }

    // Create a callback function for messages from the worker thread.
    const onMessageReceived = (e) => { /* TODO: See below */};

    // Attach the callback function as an event listener.
    worker.current.addEventListener('message', onMessageReceived);

    // Define a cleanup function for when the component is unmounted.
    return () => worker.current.removeEventListener('message', onMessageReceived);
  });
```

### 如何进行上色
有了上面的模型，就可以在图片中找到头发和嘴唇的位置了，那么如何进行上色呢？

如果只是单纯的将选中的颜色设置上去，那么就会变成这样子。




这应该不是我们想要的效果，我们想要的应该仅仅修改颜色，但是“人物外貌”保持原状。

#### 关于颜色的表示
表示颜色的方法有很多种，开发最常用的有 RGBA 和 HEX（十六进制表示）。

#### RGBA
RGBA 的原理就是三种[“原色”](https://en.wikipedia.org/wiki/Primary_color)（红色、黄色和蓝色）可以混合出其他想要的颜色。所以只需要控制三种颜色的比例，就可以表示其他的颜色了。

`RGBA 表示` 就是一个颜色，拆分成`红绿蓝`三个通道，再加上一个透明度通道。通过这四个通道来表示一个颜色。
比如 `rgb(15, 213, 133)`

#### HEX（十六进制表示）
十六进制格式是另一种表示 RGB 颜色的方式，RGBA 通道的值范围是 0-255（位深为8的情况下），hex 就是用16进制来表示通道值。两个表示一个通道值。如果是表示 rgb 就是6位；如果要表示透明通道， 就是8位。比如`rgb(255, 255, 255)`将是`#ffffff`

#### HSL
除了上面提到的两种颜色表示方法。其实理解起来更友好的是 HSL 的表示方式。`hsl(180, 50%, 50%)`, 它根据色调、饱和度和亮度来定义颜色:
- Hue(色度、色向、色调）: 指整体颜色。例如，红色、橙色、黄色、绿色、蓝色和紫色。（色调范围从 0 到 360）;
- Saturation( 饱和度):描述颜色的鲜艳程度或强度。低饱和度的颜色会显得灰暗或褪色，而高饱和度的颜色会显得强烈和丰富多彩。（饱和度范围从 0% 到 100%）;
- Lightness(亮度):描述颜色的明暗程度。黑色的亮度非常低。白色的亮度非常高。（亮度范围从 0% 到 100%）;

用这种格式表示颜色，我们在修改的时候，仅仅改变色调，而不要改变亮度和饱和度。就可以实现在修改颜色的同时，保持图片的原来效果了。

```js
export function changeHue(rgb: [number, number, number], newHue: number): [number, number, number] {
    const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    hsl[0] = newHue; // 改变色调
    return hslToRgb(hsl[0], hsl[1], hsl[2]);
}

```


### 如何进行图片像素级的替换
这里可以参考作者的另一个 blog ,写的比较详细了，这里不再进行赘述。
[ web 图像处理 - 从零实现一个照片编辑器](https://juejin.cn/post/7235294096951902266)

## 参考
[transformers.js ](https://huggingface.co/docs/transformers.js/tutorials/next)

[Xenova/face-parsing](https://huggingface.co/Xenova/face-parsing)

[hsl-a-color-format-for-humans](https://cloudfour.com/thinks/hsl-a-color-format-for-humans/)


