interface Photo {
    id: string;
    src: string;
    alt: string;
}

interface PhotoCarouselProps {
    photos: Photo[];
    isLoading?: boolean;
    className?: string;
}

const PhotoCarousel = ({
    photos,
    isLoading = false,
    className = ''
}: PhotoCarouselProps) => {
    if (isLoading) {
        return (
            <div className={`w-full max-w-full overflow-hidden ${className}`}>
                <div className="w-0 min-w-full flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {[...Array(6)].map((_, index) => (
                        <div key={index} className="shrink-0">
                            <div className="w-[135px] h-[93px] rounded-lg bg-[#232323] animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full max-w-full overflow-hidden ${className}`}>
            <div className="w-0 min-w-full flex gap-2 overflow-x-auto scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {photos.map((photo) => (
                    <div key={photo.id} className="shrink-0 cursor-pointer">
                        <div className="relative w-[135px] h-[93px] rounded-lg overflow-hidden">
                            <img
                                src={photo.src}
                                alt={photo.alt}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PhotoCarousel;