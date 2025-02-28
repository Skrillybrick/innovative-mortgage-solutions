import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  testimonials = [
    {
      quote: "Innovative Mortgage Solutions made the home buying process so simple and stress-free. Their team guided me every step of the way!",
      author: "Sarah J.",
      location: "Denver, CO"
    },
    {
      quote: "I was able to refinance with a much better rate than I expected. The loan officers were knowledgeable and responsive.",
      author: "Michael T.",
      location: "Portland, OR"
    },
    {
      quote: "After being turned down by two banks, Innovative Mortgage Solutions found the perfect loan product for my unique situation.",
      author: "Elena R.",
      location: "Austin, TX"
    }
  ];
}