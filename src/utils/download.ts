export const download = async (canvasRef: any) => {

    const canvas = canvasRef.current;
    // 创建一个 a 标签，并设置 href 和 download 属性
    const el = document.createElement('a');
    // 设置 href 为图片经过 base64 编码后的字符串，默认为 png 格式
    if (!canvas) {
        return;
    }
    el.href = canvas.toDataURL();
    el.download = '文件名称';

    // 创建一个点击事件并对 a 标签进行触发
    const event = new MouseEvent('click');
    el.dispatchEvent(event);
};