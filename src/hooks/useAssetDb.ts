import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { dbFileDexie as db } from '@/lib/db'

export const useAssetData = () => {

    const mediaList = useLiveQuery(
        () => db.files?.toArray?.()
    );

    const media = useMemo(() => mediaList?.length ? mediaList.at(-1) : null, [mediaList])

    const mediaData = useMemo(() => media?.data ?? null, [media]);
    const mediaName = useMemo(() => media?.name ?? null, [media]);


    const saveAsset = async ({
        name,
        data,
        url,
    }: {
        name: string,
        data: any,
        url?: string,
    }) => {
        await db.files.put({ name, data, url })
    }

    return {
        media,
        saveAsset,
        mediaData,
        mediaName,
    };
};
