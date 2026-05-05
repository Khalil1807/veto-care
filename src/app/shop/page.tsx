"use client"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"

const PRODUCTS = [
  { id: 1, name: "Premium Dog Food (10kg)", price: 45.99, image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&q=80", category: "Food" },
  { id: 2, name: "Interactive Cat Toy", price: 12.50, image: "https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=500&q=80", category: "Toys" },
  { id: 3, name: "Pet Grooming Kit", price: 29.99, image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=500&q=80", category: "Accessories" },
  { id: 4, name: "Cozy Pet Bed", price: 35.00, image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=500&q=80", category: "Accessories" },
  { id: 5, name: "Grain-Free Cat Food", price: 38.50, image: "https://images.unsplash.com/photo-1623366302587-bcaad5440cb6?w=500&q=80", category: "Food" },
  { id: 6, name: "Durable Dog Chew Bone", price: 8.99, image: "https://images.unsplash.com/photo-1605364177579-247656969b82?w=500&q=80", category: "Toys" },
]

export default function ShopPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="mb-12 text-center space-y-4">
        <h1 className="text-4xl font-bold font-heading text-[#3D3759]">Dr Paws Shop</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Premium food, toys, and accessories for your beloved pets. Delivered right to your door.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {PRODUCTS.map(product => (
          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow border-primary/10 group">
            <div className="h-64 overflow-hidden relative">
              <img src={product.image} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary">
                {product.category}
              </div>
            </div>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-[#3D3759] mb-2">{product.name}</h3>
              <p className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</p>
            </CardContent>
            <CardFooter className="px-6 pb-6 pt-0">
              <Button className="w-full rounded-xl gap-2 font-bold h-12 hover:scale-105 transition-transform">
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
