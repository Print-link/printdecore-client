import { ServiceCard } from "./ServiceCard";
import largeFormat1 from "../../assets/images/largeFormat/large_1.jpg";
import largeFormat2 from "../../assets/images/largeFormat/large_2.jpg";
import largeFormat3 from "../../assets/images/largeFormat/large_3.jpg";
import largeFormat4 from "../../assets/images/largeFormat/large_4.jpg";
import documentPrinting1 from "../../assets/images/documentPrinting/paper_1.jpg";
import documentPrinting2 from "../../assets/images/documentPrinting/paper_2.jpg";
import documentPrinting3 from "../../assets/images/documentPrinting/paper_3.png";
import documentPrinting4 from "../../assets/images/documentPrinting/paper_4.png";
import sticker1 from "../../assets/images/stickerPrinting/sticker_1.jpeg";
import sticker2 from "../../assets/images/stickerPrinting/sticker_2.jpg";
import sticker3 from "../../assets/images/stickerPrinting/sticker_3.jpg";
import sticker4 from "../../assets/images/stickerPrinting/sticker_4.png";
import sticker5 from "../../assets/images/stickerPrinting/sticker_5.jpg";


const services = [
	{
		name: "Large Format Printing",
		images: [
			largeFormat1,
			largeFormat2,
			largeFormat3,
			largeFormat4,
		],
		examples: "Banners, Posters, Signage",
	},
	{
		name: "Document Printing",
		images: [
			documentPrinting1,
			documentPrinting2,
			documentPrinting3,
			documentPrinting4,
		],
		examples: "Business Cards, Flyers, Brochures",
	},
	{
		name: "Stickers & Labels",
		images: [
			sticker1,
			sticker2,
			sticker3,
			sticker4,
			sticker5,
		],
		examples: "Custom Stickers, Vinyl Labels",
	},
	{
		name: "Art & Design",
		images: [
			"https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=300&fit=crop",
			"https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop",
			"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop",
		],
		examples: "Art Prints, Canvas, Photo Paper",
	},
];

export const ServicesShowcaseSection = () => {
	return (
		<section className="py-16 bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
					Print services our trusted partners offer
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{services.map((service, serviceIndex) => (
						<ServiceCard
							key={serviceIndex}
							service={service}
							serviceIndex={serviceIndex}
						/>
					))}
				</div>
			</div>
		</section>
	);
};

