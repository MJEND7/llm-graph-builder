import { useState, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ExtendedRelationship } from '@/types';

// Types
interface BaseNode {
    id: string;
    labels?: string[];
    properties: Record<string, any>;
}

// Utility functions
const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
};

const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
};

const searchInObject = (obj: Record<string, any>, searchTerm: string): boolean => {
    const normalizedSearchTerm = searchTerm.toLowerCase();
    return Object.values(obj).some(value => {
        if (typeof value === 'string') {
            return value.toLowerCase().includes(normalizedSearchTerm);
        }
        if (typeof value === 'number') {
            return value.toString().includes(normalizedSearchTerm);
        }
        if (typeof value === 'object' && value !== null) {
            return searchInObject(value, searchTerm);
        }
        return false;
    });
};

// Component: Search Input
const SearchInput = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <div className="relative w-full max-w-sm mb-4 p-3">
        <Search className="absolute left-5 top-5 h-4 w-4 text-[#ffffff]" />
        <Input
            placeholder="Search..."
            value={value}
            onChange={(e: any) => onChange(e.target.value)}
            className="pl-8 border-none bg-[#000000]/40 text-[#ffffff] placeholder-gray-500"
        />
    </div>
);

// Component: Table Wrapper
const TableWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="relative rounded-xl bg-gray-900/30 border border-[#ffffff]/50 shadow-xl">
        <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
            <div className="relative">
                {children}
            </div>
        </div>
    </div>
);

// Component: Document Table
const DocumentTable = ({ nodes }: { nodes: BaseNode[] }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredDocuments = useMemo(() => {
        const documents = nodes.filter(node => node.labels?.includes('Document'));
        if (!searchTerm) return documents;
        return documents.filter(doc =>
            searchInObject(doc.properties, searchTerm) ||
            doc.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [nodes, searchTerm]);

    return (
        <>
            <SearchInput value={searchTerm} onChange={setSearchTerm} />
            <Table>
                <TableHeader className="sticky top-0 bg-gray-900/70">
                    <TableRow className="border-[#ffffff]/70">
                        <TableHead className="text-[#ffffff] font-medium">File Name</TableHead>
                        <TableHead className="text-[#ffffff] font-medium">Status</TableHead>
                        <TableHead className="text-[#ffffff] font-medium">Progress</TableHead>
                        <TableHead className="text-[#ffffff] font-medium">Statistics</TableHead>
                        <TableHead className="text-[#ffffff] font-medium">Time</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredDocuments.map((doc) => {
                        const p = doc.properties;
                        const isError = p.status === 'error';
                        const isProcessing = p.status === 'processing';

                        return (
                            <TableRow key={doc.id} className={`border-[#ffffff]/70 ${isError ? 'bg-red-900/20' : ''}`}>
                                <TableCell className="text-[#ffffff]">
                                    <div>{p.fileName}</div>
                                    <div className="text-sm text-[#ffffff]">{p.fileType}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={isError ? 'destructive' : isProcessing ? 'secondary' : 'default'}
                                        className="bg-opacity-80"
                                    >
                                        {p.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        <div className="text-sm text-[#ffffff]">
                                            {p.processed_chunk} of {p.total_chunks} chunks
                                        </div>
                                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 transition-all duration-300"
                                                style={{ width: `${(p.processed_chunk / p.total_chunks) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-[#ffffff]">
                                    <div className="space-y-1">
                                        <div>
                                            <span className="font-medium">{formatNumber(p.nodeCount)}</span> nodes
                                        </div>
                                        <div className="text-sm text-[#ffffff]">
                                            <span>{formatNumber(p.relationshipCount)}</span> relationships
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-[#ffffff]">
                                    <div>{p.processingTime.toFixed(1)}s</div>
                                    <div className="text-sm text-[#ffffff]">
                                        {formatDateTime(p.createdAt)}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </>
    );
};

// Component: Chunk Table
const ChunkTable = ({ nodes }: { nodes: BaseNode[] }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredChunks = useMemo(() => {
        const chunks = nodes.filter(node => node.labels?.includes('Chunk'))
            .sort((a, b) => a.properties.position - b.properties.position);
        if (!searchTerm) return chunks;
        return chunks.filter(chunk =>
            searchInObject(chunk.properties, searchTerm) ||
            chunk.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [nodes, searchTerm]);

    return (
        <>
            <SearchInput value={searchTerm} onChange={setSearchTerm} />
            <Table>
                <TableHeader className="sticky top-0 bg-gray-900/70">
                    <TableRow className="border-[#ffffff]/70">
                        <TableHead className="text-[#ffffff] font-medium">File Name</TableHead>
                        <TableHead className="text-[#ffffff] font-medium">Location</TableHead>
                        <TableHead className="text-[#ffffff] font-medium">Content</TableHead>
                        <TableHead className="text-[#ffffff] font-medium">Reference</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredChunks.map((chunk) => {
                        const p = chunk.properties;
                        return (
                            <TableRow key={chunk.id} className="border-[#ffffff]/70">
                                <TableCell className="text-[#ffffff]">{p.fileName}</TableCell>
                                <TableCell className="text-[#ffffff]">
                                    <div>Position: {p.position}</div>
                                    <div className="text-sm text-[#ffffff]">
                                        Page {p.page_number}
                                    </div>
                                </TableCell>
                                <TableCell className="text-[#ffffff]">
                                    <div>Offset: {formatNumber(p.content_offset)}</div>
                                    <div className="text-sm text-[#ffffff]">
                                        Length: {formatNumber(p.length)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <code className="text-xs bg-gray-800/50 text-[#ffffff] px-2 py-1 rounded">
                                        {p.id}
                                    </code>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </>
    );
};

// Component: Entity Table
const EntityTable = ({ nodes }: { nodes: BaseNode[] }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEntities = useMemo(() => {
        const entities = nodes.filter(node =>
            !node.labels?.includes('Chunk') &&
            !node.labels?.includes('Document')
        );
        if (!searchTerm) return entities;
        return entities.filter(entity =>
            searchInObject(entity.properties, searchTerm) ||
            entity.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entity.labels?.some(label =>
                label.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [nodes, searchTerm]);

    return (
        <>
            <SearchInput value={searchTerm} onChange={setSearchTerm} />
            <Table>
                <TableHeader className="sticky top-0 bg-gray-900/70">
                    <TableRow className="border-[#ffffff]/70">
                        <TableHead className="text-[#ffffff] font-medium">Entity</TableHead>
                        <TableHead className="text-[#ffffff] font-medium">Type</TableHead>
                        <TableHead className="text-[#ffffff] font-medium">Properties</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredEntities.map((entity) => (
                        <TableRow key={entity.id} className="border-[#ffffff]/70">
                            <TableCell>
                                <code className="text-xs bg-gray-800/50 text-[#ffffff] px-2 py-1 rounded">
                                    {entity.id}
                                </code>
                            </TableCell>
                            <TableCell>
                                {entity.labels?.map(label => (
                                    <Badge key={label} variant="outline" className="mr-1 border-[#ffffff] text-[#ffffff]">
                                        {label}
                                    </Badge>
                                ))}
                            </TableCell>
                            <TableCell className="text-[#ffffff]">
                                <div className="space-y-1">
                                    {Object.entries(entity.properties).map(([key, value]) => (
                                        <div key={key} className="text-sm">
                                            <span className="font-medium">{key}:</span>{' '}
                                            <span className="text-[#ffffff]">{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    );
};

// Component: Relationship Table
const RelationshipTable = ({ relationships }: { relationships: ExtendedRelationship[] }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRelationships = useMemo(() => {
        if (!searchTerm) return relationships;
        return relationships.filter(rel =>
            rel.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rel.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rel.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
            searchInObject(rel.captions || {}, searchTerm)
        );
    }, [relationships, searchTerm]);

    return (
        <>
            <SearchInput value={searchTerm} onChange={setSearchTerm} />
            <Table>
                <TableHeader className="sticky top-0 bg-gray-900/70">
                    <TableRow className="border-[#ffffff]/70">
                        <TableHead className="text-[#ffffff] font-medium">Type</TableHead>
                        <TableHead className="text-[#ffffff] font-medium">Connection</TableHead>
                        <TableHead className="text-[#ffffff] font-medium">Properties</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredRelationships.map((rel) => (
                        <TableRow key={rel.id} className="border-[#ffffff]/70">
                            <TableCell>
                                <Badge variant="outline" className="border-[#ffffff] text-[#ffffff]">
                                    {rel.type}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-[#ffffff]/70">
                                <div className="space-y-1">
                                    <div>
                                        <span className="text-sm text-[#ffffff]">From: </span>
                                        <code className="text-xs bg-gray-800/50 text-[#ffffff] px-2 py-1 rounded">
                                            {rel.from}
                                        </code>
                                    </div>
                                    <div>
                                        <span className="text-sm text-[#ffffff]">To: </span>
                                        <code className="text-xs bg-gray-800/50 text-[#ffffff] px-2 py-1 rounded">
                                            {rel.to}
                                        </code>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-[#ffffff]">
                                <div className="space-y-1">
                                    {Object.entries(rel.captions || {}).map(([key, value]) => (
                                        <div key={key} className="text-sm">
                                            <span className="font-medium">{key}:</span>{' '}
                                            <span className="text-[#ffffff]">{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    );
};

// Component: TableView (Main Component)
const TableView = ({ nodes, relationships }: {
    nodes: BaseNode[];
    relationships: ExtendedRelationship[];
}) => {
    const tabs = useMemo(() => {
        const hasDocuments = nodes.some(node => node.labels?.includes('Document'));
        const hasChunks = nodes.some(node => node.labels?.includes('Chunk'));
        const hasEntities = nodes.some(node =>
            !node.labels?.includes('Chunk') &&
            !node.labels?.includes('Document')
        );
        const hasRelationships = relationships.length > 0;

        return {
            documents: hasDocuments,
            chunks: hasChunks,
            entities: hasEntities,
            relationships: hasRelationships
        };
    }, [nodes, relationships]);

    const [activeTab, setActiveTab] = useState(() => {
        if (tabs.documents) return 'documents';
        if (tabs.chunks) return 'chunks';
        if (tabs.entities) return 'entities';
        if (tabs.relationships) return 'relationships';
        return 'documents';
    });

    return (
        <div className="w-full space-y-4 rounded-xl">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full gap-2 grid-cols-4 bg-gray-900/50 backdrop-blur-sm rounded-lg">
                    {Object.entries({
                        documents: 'Documents',
                        chunks: 'Chunks',
                        entities: 'Entities',
                        relationships: 'Relationships'
                    }).map(([value, label]) => (
                        <TabsTrigger
                            key={value}
                            value={value}
                            disabled={!tabs[value as keyof typeof tabs]}
                            className="data-[state=active]:bg-[#000000]/30 hover:bg-[#000000]/30 data-[state=active]:text-[#ffffff]/70 text-[#ffffff]/50"
                        >
                            {label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="mt-4 bg-[#000000]/20 backdrop-blur-lg">
                    <TabsContent value="documents" className="m-0">
                        {tabs.documents && (
                            <TableWrapper>
                                <DocumentTable nodes={nodes} />
                            </TableWrapper>
                        )}
                    </TabsContent>
                    <TabsContent value="chunks" className="m-0">
                        {tabs.chunks && (
                            <TableWrapper>
                                <ChunkTable nodes={nodes} />
                            </TableWrapper>
                        )}
                    </TabsContent>
                    <TabsContent value="entities" className="m-0">
                        {tabs.entities && (
                            <TableWrapper>
                                <EntityTable nodes={nodes} />
                            </TableWrapper>
                        )}
                    </TabsContent>
                    <TabsContent value="relationships" className="m-0">
                        {tabs.relationships && (
                            <TableWrapper>
                                <RelationshipTable relationships={relationships} />
                            </TableWrapper>
                        )}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
};

export type { BaseNode, ExtendedRelationship };
export default TableView;

