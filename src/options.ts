import { SupportOption } from 'prettier';

const options: Record<string, SupportOption> = {
    motokoRemoveLinesAroundCodeBlocks: {
        category: 'motoko',
        type: 'boolean',
        default: false,
        description: 'Remove extra lines around code blocks',
    },
};

export default options;
