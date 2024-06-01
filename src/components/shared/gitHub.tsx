import { FAV_ICON, GIT_REPO } from "@/constants";
import Image from "next/image";

export const GitHubAvatar = () => (
    <a href={GIT_REPO} className={'fixed right-5 top-5'}>
        <Image src={FAV_ICON} width='50' height="50" alt={GIT_REPO} />
    </a>
) 