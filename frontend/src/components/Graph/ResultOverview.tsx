import React, { Dispatch, SetStateAction } from 'react';
import { ExtendedNode, ExtendedRelationship, Scheme } from '../../types';
import { graphLabels, RESULT_STEP_SIZE } from '../../utils/Constants';
import { sortAlphabetically } from '../../utils/Utils';
import { ShowAll } from '../UI/ShowAll';
import { Search } from 'lucide-react';

interface OverViewProps {
    nodes: ExtendedNode[];
    relationships: ExtendedRelationship[];
    newScheme: Scheme;
    searchQuery: string;
    setSearchQuery: Dispatch<SetStateAction<string>>;
    setNodes: Dispatch<SetStateAction<ExtendedNode[]>>;
    setRelationships: Dispatch<SetStateAction<ExtendedRelationship[]>>;
}

interface GlassChipProps {
    label: string;
    count: number;
    onClick: () => void;
    type: 'node' | 'relationship';
    scheme?: Scheme;
}

const GlassChip: React.FC<GlassChipProps> = ({ label, count, onClick, type, scheme }) => {
    const getBackgroundColor = () => {
        if (type === 'node' && scheme && scheme[label]) {
            return scheme[label];
        }
        return 'rgba(255, 255, 255, 0.1)';
    };

    const bgColor = getBackgroundColor();
    const isRelationship = type == "relationship";
    const textColorClass = isRelationship ? 'text-[#ffffff]' : 'text-[#000000]';
    const borderColorClass = isRelationship ? 'border-[#ffffff]/30 hover:border-[#ffffff]/50' : 'border-[#000000]/30 hover:border-[#000000]/50';
    const countBgClass = isRelationship ? 'bg-[#ffffff]/30' : 'bg-[#000000]/30';
    const countBorderClass = isRelationship ? 'border-[#ffffff]/20' : 'border-[#000000]/20';

    return (
        <button
            onClick={onClick}
            style={{ backgroundColor: bgColor }}
            className={`px-2 py-1 rounded-[10px] backdrop-blur-lg shadow-lg transition-all duration-300 flex items-center gap-2 group min-w-fit ${borderColorClass}`}
        >
            <span className={`text-xs font-medium whitespace-nowrap ${textColorClass}`}>
                {label}
            </span>
            <span className={`${countBgClass} px-1.5 py-0.5 rounded-full text-xs border ${countBorderClass} ${textColorClass}`}>
                {count}
            </span>
        </button>
    );
};

const ResultOverview: React.FC<OverViewProps> = ({
    nodes,
    relationships,
    newScheme,
    searchQuery,
    setSearchQuery,
    setNodes,
    setRelationships,
}) => {
    const nodeCount = (nodes: ExtendedNode[], label: string): number => {
        return [...new Set(nodes?.filter((n) => n.labels?.includes(label)).map((i) => i.id))].length;
    };

    const nodeCheck = Object.keys(newScheme).sort((a, b) => {
        if (a === graphLabels.document || a === graphLabels.chunk) return -1;
        if (b === graphLabels.document || b === graphLabels.chunk) return 1;
        return a.localeCompare(b);
    });

    const relationshipsSorted = relationships.sort(sortAlphabetically);

    const relationshipCount = (relationships: ExtendedRelationship[], label: string): number => {
        return [...new Set(relationships?.filter((r) => r.caption?.includes(label)).map((i) => i.id))].length;
    };

    const groupedAndSortedRelationships = Object.values(
        relationshipsSorted.reduce((acc: { [key: string]: ExtendedRelationship }, relType: any) => {
            const key = relType.caption || '';
            if (!acc[key]) {
                acc[key] = { ...relType, count: 0 };
            }
            (acc[key] as { count: number }).count += relationshipCount(relationships as ExtendedRelationship[], key);
            return acc;
        }, {})
    );

    const handleRelationshipClick = (nodeLabel: string) => {
        const updatedRelations = relationships.map((rel) => ({
            ...rel,
            selected: rel?.caption?.includes(nodeLabel),
        }));

        const updatedNodes = nodes.map((node) => ({
            ...node,
            selected: false,
            size: graphLabels.nodeSize,
        }));

        if (searchQuery !== '') setSearchQuery('');
        setRelationships(updatedRelations);
        setNodes(updatedNodes);
    };

    const handleNodeClick = (nodeLabel: string) => {
        const updatedNodes = nodes.map((node) => ({
            ...node,
            selected: node.labels.includes(nodeLabel),
        }));

        const updatedRelationships = relationships.map((rel) => ({
            ...rel,
            selected: false,
        }));

        if (searchQuery !== '') setSearchQuery('');
        setNodes(updatedNodes);
        setRelationships(updatedRelationships);
    };

    return (
        <div className="text-[#ffffff] p-3 rounded-xl">
            {nodeCheck.length > 0 && (
                <div className="space-y-6">
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-semibold text-[#ffffff]">{graphLabels.resultOverview}</h3>

                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search On Node Properties"
                                className="w-full px-4 py-2 pl-10 bg-[#ffffff]/5 rounded-lg backdrop-blur-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/50"
                            />
                            <Search className="absolute left-3 top-3 w-4 h-4 text-[#ffffff]/50" />
                        </div>

                        <div className="text-sm text-[#ffffff]">
                            {graphLabels.totalNodes} ({nodes.length})
                        </div>
                    </div>

                    <div className="overflow-scroll max-h-[320px]">
                        <div className="flex flex-wrap gap-3">
                            <ShowAll initiallyShown={RESULT_STEP_SIZE}>
                                {nodeCheck.map((nodeLabel) => (
                                    <GlassChip
                                        key={nodeLabel}
                                        label={nodeLabel}
                                        count={nodeCount(nodes, nodeLabel)}
                                        onClick={() => handleNodeClick(nodeLabel)}
                                        type="node"
                                        scheme={newScheme}
                                    />
                                ))}
                            </ShowAll>
                        </div>
                    </div>
                </div>
            )}

            {relationshipsSorted.length > 0 && (
                <div className="mt-8 space-y-6">
                    <div className="text-sm text-[#ffffff]">
                        {graphLabels.totalRelationships} ({relationships.length})
                    </div>

                    <div className="overflow-scroll max-h-[350px]">
                        <div className="flex flex-wrap gap-3">
                            <ShowAll initiallyShown={RESULT_STEP_SIZE}>
                                {groupedAndSortedRelationships.map((relType, index) => (
                                    <GlassChip
                                        key={index}
                                        label={relType.caption || ''}
                                        count={relationshipCount(relationships as ExtendedRelationship[], relType.caption || '')}
                                        onClick={() => handleRelationshipClick(relType.caption || '')}
                                        type="relationship"
                                    />
                                ))}
                            </ShowAll>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultOverview;
