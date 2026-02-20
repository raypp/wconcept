import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Loader2, ImageIcon, RefreshCw, ExternalLink, Layers } from 'lucide-react';
import {
    listProjects,
    listScreens,
    fetchScreenImage,
    type StitchProject,
    type StitchScreen,
} from '../lib/stitch';

export function StitchProjectPanel() {
    const [projects, setProjects] = useState<StitchProject[]>([]);
    const [expandedProject, setExpandedProject] = useState<string | null>(null);
    const [screens, setScreens] = useState<Record<string, StitchScreen[]>>({});
    const [screenImages, setScreenImages] = useState<Record<string, string>>({});
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [loadingScreens, setLoadingScreens] = useState<string | null>(null);
    const [loadingImage, setLoadingImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedScreen, setSelectedScreen] = useState<{ screen: StitchScreen; imageUrl: string } | null>(null);

    const loadProjects = async () => {
        setLoadingProjects(true);
        setError(null);
        try {
            const data = await listProjects();
            setProjects(data);
        } catch (e) {
            setError((e as Error).message || 'Stitch 프로젝트를 불러오지 못했습니다.');
        } finally {
            setLoadingProjects(false);
        }
    };

    useEffect(() => { loadProjects(); }, []);

    const toggleProject = async (project: StitchProject) => {
        if (expandedProject === project.id) {
            setExpandedProject(null);
            return;
        }
        setExpandedProject(project.id);
        if (!screens[project.id]) {
            setLoadingScreens(project.id);
            try {
                const data = await listScreens(project.id);
                setScreens(prev => ({ ...prev, [project.id]: data }));
            } catch {
                setScreens(prev => ({ ...prev, [project.id]: [] }));
            } finally {
                setLoadingScreens(null);
            }
        }
    };

    const loadScreenImage = async (screen: StitchScreen) => {
        if (screenImages[screen.id]) {
            setSelectedScreen({ screen, imageUrl: screenImages[screen.id] });
            return;
        }
        setLoadingImage(screen.id);
        try {
            const url = await fetchScreenImage(screen.id, screen.project_id);
            if (url) {
                setScreenImages(prev => ({ ...prev, [screen.id]: url }));
                setSelectedScreen({ screen, imageUrl: url });
            }
        } finally {
            setLoadingImage(null);
        }
    };

    return (
        <>
            {/* 패널 */}
            <div className="bg-white border rounded-xl overflow-hidden">
                {/* 헤더 */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-semibold text-gray-900">Stitch 프로젝트</span>
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded-full">
                            Google Labs
                        </span>
                    </div>
                    <button
                        onClick={loadProjects}
                        className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                        title="새로고침"
                    >
                        <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                </div>

                {/* 본문 */}
                <div className="divide-y max-h-[420px] overflow-y-auto">
                    {loadingProjects ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                            <p className="text-xs text-gray-400">프로젝트 불러오는 중...</p>
                        </div>
                    ) : error ? (
                        <div className="px-4 py-6 text-center">
                            <p className="text-sm text-red-500 mb-3">{error}</p>
                            <button
                                onClick={loadProjects}
                                className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            >
                                다시 시도
                            </button>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                            <p className="text-sm text-gray-400">Stitch 프로젝트가 없습니다.</p>
                            <a
                                href="https://stitch.withgoogle.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-2 text-xs text-blue-500 hover:underline"
                            >
                                Stitch에서 프로젝트 만들기 <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    ) : (
                        projects.map((project) => (
                            <div key={project.id}>
                                {/* 프로젝트 행 */}
                                <button
                                    onClick={() => toggleProject(project)}
                                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                >
                                    {expandedProject === project.id
                                        ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                        : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    }
                                    <span className="text-sm font-medium text-gray-900 truncate">{project.name}</span>
                                    {project.updated_at && (
                                        <span className="ml-auto text-[10px] text-gray-400 flex-shrink-0">
                                            {new Date(project.updated_at).toLocaleDateString('ko-KR')}
                                        </span>
                                    )}
                                </button>

                                {/* 스크린 목록 */}
                                {expandedProject === project.id && (
                                    <div className="bg-gray-50 border-t">
                                        {loadingScreens === project.id ? (
                                            <div className="flex items-center gap-2 px-8 py-3">
                                                <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                                                <span className="text-xs text-gray-400">스크린 불러오는 중...</span>
                                            </div>
                                        ) : (screens[project.id] ?? []).length === 0 ? (
                                            <p className="px-8 py-3 text-xs text-gray-400">스크린이 없습니다.</p>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2 p-3">
                                                {(screens[project.id] ?? []).map((screen) => (
                                                    <button
                                                        key={screen.id}
                                                        onClick={() => loadScreenImage(screen)}
                                                        className="relative group bg-white border rounded-lg overflow-hidden hover:border-blue-400 hover:shadow-md transition-all text-left"
                                                    >
                                                        {/* 썸네일 */}
                                                        <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                                                            {screen.thumbnail_url ? (
                                                                <img
                                                                    src={screen.thumbnail_url}
                                                                    alt={screen.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : loadingImage === screen.id ? (
                                                                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                                                            ) : (
                                                                <ImageIcon className="w-5 h-5 text-blue-300" />
                                                            )}
                                                        </div>
                                                        <div className="px-2 py-1.5">
                                                            <p className="text-[11px] font-medium text-gray-700 truncate">
                                                                {screen.name}
                                                            </p>
                                                        </div>
                                                        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* 하단 링크 */}
                <div className="px-4 py-2 border-t bg-gray-50">
                    <a
                        href="https://stitch.withgoogle.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-500 transition-colors"
                    >
                        stitch.withgoogle.com <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </div>

            {/* 스크린 이미지 모달 */}
            {selectedScreen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-6"
                    style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                    onClick={() => setSelectedScreen(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">Stitch 스크린</p>
                                <h3 className="text-base font-semibold text-gray-900">{selectedScreen.screen.name}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedScreen(null)}
                                className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                닫기
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto bg-gray-100 p-4 flex items-center justify-center">
                            <img
                                src={selectedScreen.imageUrl}
                                alt={selectedScreen.screen.name}
                                className="max-w-full max-h-full rounded-lg shadow-lg"
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
