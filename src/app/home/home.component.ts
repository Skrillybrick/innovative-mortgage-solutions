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
      quote: "Innovative Mortgage Solutions made the home buying process so simple and stress-free. And dare I say... sexy?",
      author: "Cathy D.",
      location: "Saratoga Springs, UT"
    },
    {
      quote: "I was able to refinance with a much better rate than I expected, probably because I'm sleeping with the owner's daughter.",
      author: "Chase S.",
      location: "Eagle Mountain, UT"
    },
    {
      quote: "After being turned down by two banks, I realized home ownership wasn't really for me. Also I owe a lot in child support.",
      author: "Parker F.",
      location: "His Mom's Basement, UT"
    }
  ];
}