import { Button } from '@/shared/components/ui/button';
import { Heart, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface ReactionButtonProps {
    hasReacted: boolean;
    count: number;
    isLoading: boolean;
    onToggle: () => void;
    size?: 'sm' | 'default';
}

export function ReactionButton({
    hasReacted,
    count,
    isLoading,
    onToggle,
    size = 'default',
}: ReactionButtonProps) {
    const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    const buttonSize = size === 'sm' ? 'h-8 px-3' : 'h-10 px-4';

    return (
        <Button
            variant={hasReacted ? 'default' : 'outline'}
            size="sm"
            className={cn(buttonSize, 'gap-2')}
            onClick={onToggle}
            disabled={isLoading}
        >
            {isLoading ? (
                <Loader2 className={cn(iconSize, 'animate-spin')} />
            ) : (
                <Heart
                    className={cn(
                        iconSize,
                        hasReacted && 'fill-current'
                    )}
                />
            )}
            <span>{count}</span>
        </Button>
    );
}
