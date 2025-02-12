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
        <Search className="absolute left-5 top-5 h-4 w-4 text-muted-foreground" />
        <Input
            placeholder="Search..."
            value={value}
            onChange={(e: any) => onChange(e.target.value)}
            className="pl-8"
        />
    </div>
);

// Component: Table Wrapper
const TableWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="relative rounded-md">
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
                <TableHeader className="sticky top-0">
                    <TableRow>
                        <TableHead className="underline w-64 font-bold text-primary bg-transparent">File Name</TableHead>
                        <TableHead className="underline font-bold text-primary bg-transparent">Status</TableHead>
                        <TableHead className="underline font-bold text-primary bg-transparent">Progress</TableHead>
                        <TableHead className="underline font-bold text-primary bg-transparent">Statistics</TableHead>
                        <TableHead className="underline font-bold text-primary bg-transparent">Time</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredDocuments.map((doc) => {
                        const p = doc.properties;
                        const isError = p.status === 'error';
                        const isProcessing = p.status === 'processing';

                        return (
                            <TableRow key={doc.id} className={isError ? 'bg-red-50' : ''}>
                                <TableCell className="font-medium">
                                    <div>{p.fileName}</div>
                                    <div className="text-sm text-muted-foreground">{p.fileType}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={isError ? 'destructive' : isProcessing ? 'secondary' : 'default'}
                                    >
                                        {p.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        <div className="text-sm text-muted-foreground">
                                            {p.processed_chunk} of {p.total_chunks} chunks
                                        </div>
                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-300"
                                                style={{ width: `${(p.processed_chunk / p.total_chunks) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        <div>
                                            <span className="font-medium">{formatNumber(p.nodeCount)}</span> nodes
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            <span>{formatNumber(p.relationshipCount)}</span> relationships
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div>{p.processingTime.toFixed(1)}s</div>
                                    <div className="text-sm text-muted-foreground">
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
                <TableHeader className="sticky top-0">
                    <TableRow>
                        <TableHead className="underline w-64 font-bold text-primary bg-transparent">File Name</TableHead>
                        <TableHead className="underline font-bold text-primary bg-transparent">Location</TableHead>
                        <TableHead className="underline font-bold text-primary bg-transparent">Content</TableHead>
                        <TableHead className="underline font-bold text-primary bg-transparent">Reference</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredChunks.map((chunk) => {
                        const p = chunk.properties;
                        return (
                            <TableRow key={chunk.id}>
                                <TableCell className="font-medium">{p.fileName}</TableCell>
                                <TableCell>
                                    <div>Position: {p.position}</div>
                                    <div className="text-sm text-muted-foreground">
                                        Page {p.page_number}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div>Offset: {formatNumber(p.content_offset)}</div>
                                    <div className="text-sm text-muted-foreground">
                                        Length: {formatNumber(p.length)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
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
                <TableHeader className="sticky top-0">
                    <TableRow>
                        <TableHead className="w-64 font-bold text-primary bg-transparent underline">Entity</TableHead>
                        <TableHead className="font-bold text-primary bg-transparent underline">Type</TableHead>
                        <TableHead className="font-bold text-primary bg-transparent underline">Properties</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredEntities.map((entity) => (
                        <TableRow key={entity.id}>
                            <TableCell>
                                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                    {entity.id}
                                </code>
                            </TableCell>
                            <TableCell>
                                {entity.labels?.map(label => (
                                    <Badge key={label} variant="outline" className="mr-1">
                                        {label}
                                    </Badge>
                                ))}
                            </TableCell>
                            <TableCell>
                                <div className="space-y-1">
                                    {Object.entries(entity.properties).map(([key, value]) => (
                                        <div key={key} className="text-sm">
                                            <span className="font-medium">{key}:</span>{' '}
                                            {String(value)}
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
                <TableHeader className="sticky top-0">
                    <TableRow>
                        <TableHead className="underline font-bold text-primary bg-transparent">Type</TableHead>
                        <TableHead className="underline font-bold text-primary bg-transparent">Connection</TableHead>
                        <TableHead className="underline font-bold text-primary bg-transparent">Properties</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredRelationships.map((rel) => (
                        <TableRow key={rel.id}>
                            <TableCell>
                                <Badge variant="outline">{rel.type}</Badge>
                            </TableCell>
                            <TableCell>
                                <div className="space-y-1">
                                    <div>
                                        <span className="text-sm text-muted-foreground">From: </span>
                                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                            {rel.from}
                                        </code>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground">To: </span>
                                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                            {rel.to}
                                        </code>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="space-y-1">
                                    {Object.entries(rel.captions || {}).map(([key, value]) => (
                                        <div key={key} className="text-sm">
                                            <span className="font-medium">{key}:</span>{' '}
                                            {String(value)}
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
        <div className="w-full p-5 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
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
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                            {label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="mt-4">
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
