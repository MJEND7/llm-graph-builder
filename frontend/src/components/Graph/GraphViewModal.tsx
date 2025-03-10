import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LoadingSpinner, useDebounceValue } from '@neo4j-ndl/react';
import { InteractiveNvlWrapper } from '@neo4j-nvl/react';
import NVL from '@neo4j-nvl/base';
import type { Node, Relationship } from '@neo4j-nvl/base';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    RotateCw,
    ZoomIn,
    ZoomOut,
    Maximize2,
} from 'lucide-react';
import {
    BasicNode,
    BasicRelationship,
    EntityType,
    ExtendedNode,
    ExtendedRelationship,
    GraphType,
    GraphViewModalProps,
    Scheme,
} from '../../types';
import { filterData, graphTypeFromNodes, processGraphData } from '../../utils/Utils';
import { graphQueryAPI } from '../../services/GraphQuery';
import { graphLabels, nvlOptions, queryMap } from '../../utils/Constants';
import GraphPropertiesPanel from './GraphPropertiesPanel';
import TableView from './TabelViw';

const GraphViewModal: React.FC<GraphViewModalProps> = ({
    open,
    inspectedName,
    viewPoint,
    nodeValues,
    relationshipValues,
    selectedRows,
}) => {
    const nvlRef = useRef<NVL>(null);
    const [nodes, setNodes] = useState<ExtendedNode[]>([]);
    const [relationships, setRelationships] = useState<ExtendedRelationship[]>([]);
    const [allNodes, setAllNodes] = useState<ExtendedNode[]>([]);
    const [allRelationships, setAllRelationships] = useState<Relationship[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [status, setStatus] = useState<'unknown' | 'success' | 'danger'>('unknown');
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [scheme, setScheme] = useState<Scheme>({});
    const [newScheme, setNewScheme] = useState<Scheme>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery] = useDebounceValue(searchQuery, 300);
    const [graphType, setGraphType] = useState<GraphType[]>([]);
    const [disableRefresh, setDisableRefresh] = useState<boolean>(false);
    const [selected, setSelected] = useState<{ type: EntityType; id: string } | undefined>(undefined);
    const [mode, setMode] = useState<boolean>(false);
    const [isInit, setInit] = useState<boolean>(true);
    const [isTableView, setIsTableView] = useState(false);
    const [allInitNodes, setAllInitNodes] = useState<ExtendedNode[]>([]);
    const [allInitRelationships, setAllInitRelationships] = useState<Relationship[]>([]);
    const [_, setActiveTab] = useState<GraphType>('DocumentChunk');

    const graphQuery: string = queryMap.DocChunkEntities;

    // Zoom to fit function
    const handleZoomToFit = () => {
        nvlRef.current?.fit(
            allNodes.map((node) => node.id),
            {}
        );
    };

    // Cleanup on unmount
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            handleZoomToFit();
        }, 10);
        return () => {
            if (nvlRef.current) {
                nvlRef.current?.destroy();
            }
            setGraphType([]);
            clearTimeout(timeoutId);
            setScheme({});
            setNodes([]);
            setRelationships([]);
            setAllNodes([]);
            setAllRelationships([]);
            setSearchQuery('');
            setSelected(undefined);
        };
    }, []);

    // Update graph type based on nodes
    useEffect(() => {
        const updateGraphType = mode
            ? graphTypeFromNodes(nodes)
            : graphTypeFromNodes(allNodes);

        if (Array.isArray(updateGraphType)) {
            setGraphType(updateGraphType);
        }
    }, [allNodes, mode, nodes]);

    // Fetch data from API
    const fetchData = useCallback(async () => {
        try {
            console.log(graphQuery)
            return viewPoint === graphLabels.showGraphView
                ? await graphQueryAPI(graphQuery, selectedRows?.map((f) => f))
                : await graphQueryAPI(graphQuery, [inspectedName ?? '']);
        } catch (error) {
            console.error(error);
            return null;
        }
    }, [viewPoint, selectedRows, graphQuery, inspectedName]);

    // Graph API call
    const graphApi = async (mode?: string) => {
        try {
            const result = await fetchData();
            if (result?.data.data.nodes.length > 0) {
                const neoNodes = result?.data.data.nodes;
                const nodeIds = new Set(neoNodes.map((node: any) => node.element_id));
                const neoRels = result?.data.data.relationships
                    .filter((rel: any) =>
                        nodeIds.has(rel.end_node_element_id) &&
                        nodeIds.has(rel.start_node_element_id)
                    );

                const { finalNodes, finalRels, schemeVal } = processGraphData(neoNodes, neoRels);

                if (mode === 'refreshMode') {
                    initGraph(graphType, finalNodes, finalRels, schemeVal);
                } else {
                    setNodes(finalNodes);
                    setRelationships(finalRels);
                    setNewScheme(schemeVal);
                }

                if (isInit) {
                    setInit(false)
                    setAllInitNodes(finalNodes);
                    setAllInitRelationships(finalRels);
                }
                setAllNodes(finalNodes);
                setAllRelationships(finalRels);
                setScheme(schemeVal);
                setDisableRefresh(false);
                setLoading(false);
            } else {
                setLoading(false);
                setStatus('danger');
                setStatusMessage(`No Nodes and Relations for the ${inspectedName} file`);
            }
        } catch (error: any) {
            setLoading(false);
            setStatus('danger');
            setStatusMessage(error.message);
        }
    };

    // Initialize on open
    useEffect(() => {
        if (open) {
            setLoading(true);
            setGraphType([]);

            if (viewPoint !== graphLabels.chatInfoView) {
                graphApi();
            } else {
                const { finalNodes, finalRels, schemeVal } = processGraphData(
                    nodeValues ?? [],
                    relationshipValues ?? []
                );
                setAllNodes(finalNodes);
                setAllRelationships(finalRels);
                setScheme(schemeVal);
                setNodes(finalNodes);
                setRelationships(finalRels);
                setNewScheme(schemeVal);
                setLoading(false);
            }
        }
    }, [open]);

    // Handle search
    useEffect(() => {
        if (debouncedQuery) {
            handleSearch(debouncedQuery);
        }
    }, [debouncedQuery]);

    // Initialize graph with filtered data
    const initGraph = (
        graphType: GraphType[],
        finalNodes: ExtendedNode[],
        finalRels: Relationship[],
        schemeVal: Scheme
    ) => {
        if (allNodes.length > 0 && allRelationships.length > 0) {
            const { filteredNodes, filteredRelations, filteredScheme } = filterData(
                graphType,
                finalNodes,
                finalRels,
                schemeVal
            );
            setNodes(filteredNodes);
            setRelationships(filteredRelations);
            setNewScheme(filteredScheme);
        }
    };

    // Get selected item
    const selectedItem = useMemo(() => {
        if (!selected) return undefined;
        return selected.type === 'node'
            ? nodes.find((node) => node.id === selected.id)
            : relationships.find((rel) => rel.id === selected.id);
    }, [selected, relationships, nodes]);

    // Search handler
    const handleSearch = useCallback(
        (value: string) => {
            const query = value.toLowerCase();
            const updatedNodes = nodes.map((node) => {
                if (query === '') {
                    return {
                        ...node,
                        selected: false,
                        size: graphLabels.nodeSize,
                    };
                }
                const { id, properties, caption } = node;
                const propertiesMatch = properties?.id?.toLowerCase().includes(query);
                const match = id.toLowerCase().includes(query) || propertiesMatch || caption?.toLowerCase().includes(query);
                return {
                    ...node,
                    selected: match,
                };
            });
            // deactivating any active relationships
            const updatedRelationships = relationships.map((rel) => {
                return {
                    ...rel,
                    selected: false,
                };
            });
            setNodes(updatedNodes);
            setRelationships(updatedRelationships);
        },
        [nodes, relationships]
    );
    if (!open) return null;

    const checkBoxView = viewPoint !== graphLabels.chatInfoView;

    // Tab change handler
    const handleTabChange = (tab: GraphType) => {
        setIsTableView(tab === "Tables");
        setActiveTab(tab);
        setSearchQuery('');
        setSelected(undefined);

        if (tab === "Tables") {
            console.log(allInitNodes)
            setNodes(allInitNodes)
            setRelationships(allInitRelationships);
            return
        };

        setNodes([])
        setRelationships([]);
        initGraph([tab], allNodes, allRelationships, scheme);
        setGraphType([tab]);

        let scale = nvlRef.current?.getScale() || 0;
        if (scale > 1) {
            handleZoomToFit();
        }
    };

    // NVL callbacks
    const nvlCallbacks = {
        onLayoutComputing(isComputing: boolean) {
            if (!isComputing) {
                handleZoomToFit();
            }
        },
    };

    // Zoom handlers
    const handleZoomIn = () => nvlRef.current?.setZoom(nvlRef.current.getScale() * 1.3);
    const handleZoomOut = () => nvlRef.current?.setZoom(nvlRef.current.getScale() * 0.7);

    // Refresh handler
    const handleRefresh = () => {
        setDisableRefresh(true);
        setMode(true);
        graphApi('refreshMode');
    };

    // Mouse event callbacks
    const mouseEventCallbacks = {
        onNodeClick: (clickedNode: Node) => setSelected({ type: 'node', id: clickedNode.id }),
        onRelationshipClick: (clickedRel: Relationship) => setSelected({ type: 'relationship', id: clickedRel.id }),
        onCanvasClick: () => setSelected(undefined),
        onPan: true,
        onZoom: true,
        onDrag: true,
    };

    return (
        <div className="w-full h-full bg-[#141414] bg-gradient-to-br from-[#141414] via-[#1A1A1A] to-[#141414] shadow-[inset_0_0_4px_rgba(255,255,255,0.15)]">
            {loading ? (
                <div className="flex items-center justify-center h-full bg-[#0A0A0A]">
                    <LoadingSpinner size="large" className="text-gray-400" />
                </div>
            ) : status !== 'unknown' ? (
                <div className="flex items-center justify-center h-full bg-[#0A0A0A]">
                    <div className="bg-[#141414] px-6 py-4 rounded-lg border border-[#262626]">
                        <p className="text-gray-300">{statusMessage}</p>
                    </div>
                </div>
            ) : nodes.length === 0 && relationships.length === 0 && graphType.length !== 0 ? (
                <div className="flex items-center justify-center h-full bg-[#0A0A0A]">
                    <div className="bg-[#141414] px-6 py-4 rounded-lg border border-[#262626]">
                        <p className="text-gray-300">{graphLabels.noNodesRels}</p>
                    </div>
                </div>
            ) : graphType.length === 0 && checkBoxView ? (
                <div className="flex items-center justify-center h-full bg-[#0A0A0A]">
                    <div className="bg-[#141414] px-6 py-4 rounded-lg border border-[#262626]">
                        <p className="text-gray-300">{graphLabels.selectCheckbox}</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center p-4 bg-[#141414] border-b border-[#262626]">
                        {checkBoxView && (
                            <Tabs
                                defaultValue="DocumentChunk"
                                className="w-full"
                                onValueChange={(value) => handleTabChange(value as GraphType)}
                            >
                                <TabsList className="bg-[#0A0A0A] rounded-lg border border-[#262626]">
                                    <TabsTrigger
                                        value="DocumentChunk"
                                        className="px-4 py-2 text-sm text-gray-400 data-[state=active]:bg-[#262626] data-[state=active]:text-white rounded-md transition-all"
                                    >
                                        Document Chunk
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="Entities"
                                        className="px-4 py-2 text-sm text-gray-400 data-[state=active]:bg-[#262626] data-[state=active]:text-white rounded-md transition-all"
                                    >
                                        Entities
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="Tables"
                                        className="px-4 py-2 text-sm text-gray-400 data-[state=active]:bg-[#262626] data-[state=active]:text-white rounded-md transition-all"
                                    >
                                        Tables
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        )}

                    </div>

                    <div className="flex-1 relative bg-[#141414] bg-gradient-to-br from-[#141414] via-[#1A1A1A] to-[#141414]">
                        {isTableView ? (
                            <div className="p-6 bg-transparent">
                                <TableView nodes={nodes} relationships={relationships} />
                            </div>
                        ) : (
                            <div className="h-full">
                                <InteractiveNvlWrapper
                                    nodes={nodes}
                                    rels={relationships}
                                    nvlOptions={{
                                        ...nvlOptions,
                                    }}
                                    ref={nvlRef}
                                    mouseEventCallbacks={mouseEventCallbacks}
                                    interactionOptions={{
                                        selectOnClick: true,
                                    }}
                                    nvlCallbacks={nvlCallbacks}
                                />

                                {/* Floating controls */}
                                <div className="absolute bottom-6 right-6 flex flex-col gap-2">
                                    {viewPoint !== 'chatInfoView' && (
                                        <button
                                            onClick={handleRefresh}
                                            disabled={disableRefresh}
                                            className="p-2 bg-[#141414] hover:bg-[#262626] rounded-full border border-[#262626] transition-all group disabled:opacity-50"
                                        >
                                            <RotateCw className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                        </button>
                                    )}
                                    <button
                                        onClick={handleZoomIn}
                                        className="p-2 bg-[#141414] hover:bg-[#262626] rounded-full border border-[#262626] transition-all group"
                                    >
                                        <ZoomIn className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                    </button>
                                    <button
                                        onClick={handleZoomOut}
                                        className="p-2 bg-[#141414] hover:bg-[#262626] rounded-full border border-[#262626] transition-all group"
                                    >
                                        <ZoomOut className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                    </button>
                                    <button
                                        onClick={handleZoomToFit}
                                        className="p-2 bg-[#141414] hover:bg-[#262626] rounded-full border border-[#262626] transition-all group"
                                    >
                                        <Maximize2 className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Side panel */}
                        {!isTableView ? (
                            <div className="w-[300px] absolute right-0 top-0 h-full bg-[#141414] bg-opacity-45 backdrop-blur-lg  border-l border-[#262626]">
                                <div className="5-4 text-gray-200">
                                    {selectedItem !== undefined && (
                                        <GraphPropertiesPanel
                                            inspectedItem={selectedItem as BasicNode | BasicRelationship}
                                            newScheme={newScheme}
                                        />
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GraphViewModal;
