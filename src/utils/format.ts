import { ImageSegmentationPipelineOutput } from "@xenova/transformers";

function findBorder(matrix: number[], w: number, h: number): number[] {
    const visited = new Array(w * h).fill(false);
    const dx = [-1, 0, 1, 0];
    const dy = [0, 1, 0, -1];
    const output: number[] = [];
    const queue: [number, number][] = [];

    function isValid(x: number, y: number): boolean {
        return x >= 0 && y >= 0 && x < h && y < w;
    }

    function enqueue(x: number, y: number): void {
        const index = x * w + y;
        if (isValid(x, y) && !visited[index] && matrix[index] === 255) {
            queue.push([x, y]);
            visited[index] = true;
            output.push(index);
        }
    }

    // 对四个角进行BFS
    enqueue(0, 0);
    enqueue(0, w - 1);
    enqueue(h - 1, 0);
    enqueue(h - 1, w - 1);

    while (queue.length > 0) {
        const [x, y] = queue.shift()!;
        for (let i = 0; i < 4; i++) {
            enqueue(x + dx[i], y + dy[i]);
        }
    }

    return output;
}

// interface IData {
//     label: string
//     mask: {
//         width: number
//         height: number
//         data: number[]
//     }
// }

export function formatData(data: ImageSegmentationPipelineOutput[]) {
    const map = {
        background: 'background',
        lLip: 'l_lip',
        uLip: 'u_lip',
        hair: 'hair',
    }
    const NEED_KEY = [map.background, map.hair, map.lLip, map.uLip];

    const temp1 = data.filter((it) => NEED_KEY.includes(it.label));

    const temp2 = temp1.reduce((sum, it) => ({ ...sum, [it.label]: it.mask.data }), {})

    // @ts-ignore
    const { background, l_lip, u_lip, hair } = temp2;

    // FIXME:
    const { width, height } = temp1[0].mask;

    const lipData = [];
    const hairData = [];

    for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
            const currentIndex = j * width + i;

            if (l_lip?.[currentIndex] || u_lip?.[currentIndex]) {
                lipData.push(currentIndex)
            }

            if (hair[currentIndex]) {
                hairData.push(currentIndex)
            }

        }
    }

    const backgroundData = findBorder(background, width, height);
    backgroundData.sort((a, b) => a - b)
    return {
        lipData,
        hairData,
        backgroundData,
    }
}

