import { create } from 'zustand';
import { graphQueryAPI } from '../../services/GraphQuery';
import { processGraphData } from '../../utils/Utils';
import type { ExtendedNode, ExtendedRelationship, Scheme } from '../../types';
import { queryMap } from '../../utils/Constants';

interface CollectionsGraphState {
    nodes: ExtendedNode[];
    relationships: ExtendedRelationship[];
    scheme: Scheme;
    isLoading: boolean;
    error: string | null;
    fetchCollectionsGraph: (selectedRows?: string[]) => Promise<void>;
    reset: () => void;
}

export const useCollectionsGraphStore = create<CollectionsGraphState>((set) => ({
    nodes: [],
    relationships: [],
    scheme: {},
    isLoading: false,
    error: null,

    fetchCollectionsGraph: async (selectedRows?: string[]) => {
        set({ isLoading: true, error: null });
        try {
            const result = await graphQueryAPI(queryMap.DocChunkEntities, selectedRows);

            if (result?.data.data.nodes.length > 0) {
                const neoNodes = result.data.data.nodes;
                const nodeIds = new Set(neoNodes.map((node: any) => node.element_id));
                const neoRels = result.data.data.relationships.filter(
                    (rel: any) =>
                        nodeIds.has(rel.end_node_element_id) &&
                        nodeIds.has(rel.start_node_element_id)
                );

                const { finalNodes, finalRels, schemeVal } = processGraphData(
                    neoNodes,
                    neoRels
                );

                set({
                    nodes: finalNodes,
                    relationships: finalRels,
                    scheme: schemeVal,
                    isLoading: false,
                });
            } else {
                set({
                    isLoading: false,
                    error: 'No nodes and relationships found',
                });
            }
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'An error occurred while fetching graph data',
            });
        }
    },

    reset: () => {
        set({
            nodes: [],
            relationships: [],
            scheme: {},
            isLoading: false,
            error: null,
        });
    },
}));

// Export a hook to access filtered data based on current graph type
export const useFilteredCollectionsData = (graphType: string[]) => {
    const { nodes, relationships, scheme } = useCollectionsGraphStore();

    if (graphType.includes('Tables')) {
        // Filter logic for Tables view
        const tableNodes = nodes.filter(node =>
            node.labels.includes('Table') ||
            node.labels.includes('TableRow') ||
            node.labels.includes('TableCell')
        );

        const tableNodeIds = new Set(tableNodes.map(node => node.id));
        const tableRelationships = relationships.filter(rel =>
            tableNodeIds.has(rel.from) && tableNodeIds.has(rel.to)
        );

        return {
            filteredNodes: tableNodes,
            filteredRelationships: tableRelationships,
            filteredScheme: scheme // You might want to filter scheme as well
        };
    }

    // Return unfiltered data for other cases
    return {
        filteredNodes: nodes,
        filteredRelationships: relationships,
        filteredScheme: scheme
    };
};
