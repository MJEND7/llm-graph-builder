import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import GraphViewModal from '../Graph/GraphViewModal';
import { createDefaultFormData } from '../../API/Index';

const PageLayout = () => {
    const [searchParams] = useSearchParams();
    const names = searchParams.get('names')?.split(',') || [];
    createDefaultFormData();

    const [viewPoint] = useState('tableView');
    const [openGraphView, setOpenGraphView] = useState(true);

    // Map names to CustomFile objects with generated IDs
    const selectedFiles = names.map(name => ({
        name,
        id: `file-${name.replace(/\s+/g, '-').toLowerCase()}`
    }));

    return (
        <div className="w-full h-screen">
            <GraphViewModal
                inspectedName={names[0] || ''}
                open={openGraphView}
                setGraphViewOpen={setOpenGraphView}
                viewPoint={viewPoint}
                selectedRows={selectedFiles}
            />
        </div>
    );
};

export default PageLayout;
