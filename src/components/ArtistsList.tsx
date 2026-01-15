import { useTranslation } from 'react-i18next';
import ArtistCard, { type Artist } from '@/components/ArtistCard';

interface ArtistsListProps {
    artists: Artist[];
    isLoading?: boolean;
    className?: string;
}

const ArtistsList = ({
    artists,
    isLoading = false,
    className = '',
}: ArtistsListProps) => {
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <div className={`flex flex-col gap-[16px] w-full ${className}`}>
                <div className="flex items-center gap-[8px] px-[6px]">
                    <div className="h-7 w-24 bg-[#232323] rounded animate-pulse" />
                </div>
                <div className="flex flex-col gap-[8px]">
                    {[1, 2].map((index) => (
                        <ArtistCard
                            key={index}
                            artist={{} as Artist}
                            isLoading={true}
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (artists.length === 0) {
        return null;
    }

    return (
        <div className={`flex flex-col gap-[16px] w-full ${className}`}>
            <div className="flex items-center gap-[8px] px-[6px]">
                <h2 className="text-[#ff336d] text-[24px] font-semibold font-borna">
                    {t('event.artists', 'Artistas')}
                </h2>
            </div>
            <div className="flex flex-col gap-[8px]">
                {artists.map(artist => (
                    <ArtistCard
                        key={artist.id}
                        artist={artist}
                    />
                ))}
            </div>
        </div>
    );
};

export default ArtistsList;