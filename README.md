>If you like this project, please give me a star on [GitHub](https://github.com/mamumu123/web-makeup), it will give me more motivation to expand project functionality.

>TODO:  
> - Support changing hairstyles;
> - Display hairstyle and lip recognition results
> - Find models with higher accuracy and faster derivation speed

## Declaration
This project is a pure front-end application, and all images uploaded by users are processed locally without any security concerns.

## Effect display

![Effect display](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/jcwslu1tsqj8wsodkusz.png)

## Demo
https://web-makeup.vercel.app/makeup

## Source code 

https://github.com/mamumu123/web-makeup

## Project Introduction
This project has implemented the function of changing hair color and lipstick color, characterized by pure front-end capability, no server support, and security.

## Technical details

### How to recognize the position of hair and lips

After searching online, I found a ready-made model that can recognize the position of hair and lips.
[Xenova/face-parsing](https://huggingface.co/Xenova/face-parsing).

Using model capabilities in the front-end is relatively simple. The simplest code is the following lines.
```js
import { pipeline } from '@xenova/transformers';

const segmenter = await pipeline('image-segmentation', 'Xenova/face-parsing');

const url = ' https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/portrait-of-woman.jpg ';
const output = await segmenter(url);
console.log(output)
```

If you want to try this model capability online, you can try it on the right side of this interface. [jonathandinu/face-parsing](https://huggingface.co/jonathandinu/face-parsing).


#### Configure webpack and ignore some node modules
(The following is a reference provided in the transformers.js document)
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
// (Optional) Export as a static site
// See  https://nextjs.org/docs/pages/building-your-application/deploying/static-exports#configuration
output: 'export', // Feel free to modify/remove this option

// Override the default webpack configuration
webpack: (config) => {
// See  https://webpack.js.org/configuration/resolve/#resolvealias
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

#### Place the loading of the model in the worker
Due to the large size of the model, it can cause the project to get stuck during loading, greatly affecting the user experience. It would be more appropriate to place it in the worker and update the status after it is ready.

```js
useEffect(() => {
if (! worker.current) {
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

### How to apply color
With the above model, you can find the position of hair and lips in the picture. So how do you proceed with coloring?

If we simply set the selected color, it will become like this.




This should not be the effect we want, we only want to modify the color, but keep the "character appearance" in its original state.

#### Regarding the representation of colors
There are many ways to represent colors, and the most commonly used for development are RGBA and HEX (hexadecimal representation).

#### RGBA
The principle of RGBA is three [primary colors]（ https://en.wikipedia.org/wiki/Primary_color ）(Red, yellow, and blue) can be mixed to create other desired colors. So all you need to do is control the proportion of the three colors to represent the other colors.

`RGBA represents a color, divided into three channels: red, green, and blue, plus a transparency channel. Represent a color through these four channels.
For example, ` RGB (15, 213, 133)`

#### HEX (hexadecimal representation)
The hexadecimal format is another way to represent RGB colors. The value range of the RGBA channel is 0-255 (in the case of a bit depth of 8), and hex represents the channel value in hexadecimal. Two represents a channel value. If it means RGB is 6 bits; If you want to represent a transparent channel, it is 8 bits. For example, 'rgb (255, 255, 255)' would be '# ffffff'`

#### HSL
In addition to the two color representation methods mentioned above. In fact, a more user-friendly way to understand it is the representation of HSL` HSL (180, 50%, 50%) `, which defines colors based on hue, saturation, and brightness:
-Hue (chromaticity, direction, tone): Refers to the overall color. For example, red, orange, yellow, green, blue, and purple. (Tone range from 0 to 360);
-Saturation: describes the brightness or intensity of a color. Low saturation colors may appear dull or faded, while high saturation colors may appear strong and colorful. (saturation range from 0% to 100%);
-Brightness: describes the degree of brightness of a color. The brightness of black is very low. The brightness of white is very high. (Brightness range from 0% to 100%);

When using this format to represent colors, we only change the color tone when making modifications, without changing brightness and saturation. It is possible to maintain the original effect of the image while modifying the color.

```js
export function changeHue(rgb: [number, number, number], newHue: number): [number, number, number] {
const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
hsl[0] = newHue; //  Change color tone
return hslToRgb(hsl[0], hsl[1], hsl[2]);
}

```


## Reference
[transformers.js](https://huggingface.co/docs/transformers.js/tutorials/next )

[Xenova/face-parsing]( https://huggingface.co/Xenova/face-parsing )

[hsl-a-color-format-for-humans]( https://cloudfour.com/thinks/hsl-a-color-format-for-humans/ )
