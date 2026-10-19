import React from 'react';

// shadcn/ui Card composition adapted to React 18 and this project's SCSS theme.
// Reference: https://ui.shadcn.com/docs/components/card
function cardPart(slot: string) {
	const Part = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
		({ className = '', ...props }, ref) => (
			<div ref={ref} data-slot={slot} className={`quwat-ui-${slot} ${className}`.trim()} {...props} />
		),
	);
	Part.displayName = slot;
	return Part;
}

export const Card = cardPart('card');
export const CardHeader = cardPart('card-header');
export const CardTitle = cardPart('card-title');
export const CardDescription = cardPart('card-description');
export const CardContent = cardPart('card-content');
export const CardFooter = cardPart('card-footer');
