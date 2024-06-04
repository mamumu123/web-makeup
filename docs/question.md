### cloneDeep 
非常影响性能

```js
    if (bgType === BG_TYPE.IMAGE && bgRefs.current?.[bgIndex]) {
      console.log('in');
      const personData = cloneDeep(imageData.data);
      console.log('1111');

      // 画背景
      ctx.drawImage(bgRefs.current?.[bgIndex], 0, 0, width, height);
      imageData = ctx.getImageData(0, 0, width, height);
      data = imageData.data || {};
      console.log('2222');

      for (let index = 0; index < dataBg.length; index++) {
        if (dataBg[index] === 0) {
          imageData.data[index * 4 + 0] = personData[index * 4 + 0];
          imageData.data[index * 4 + 1] = personData[index * 4 + 1];
          imageData.data[index * 4 + 2] = personData[index * 4 + 2];
        }
      }
      console.log('333');
    }
```


### color 




### worker
https://loclv.hashnode.dev/a-simple-web-worker-demo-with-typescript-and-nextjs