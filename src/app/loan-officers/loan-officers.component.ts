import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface LoanOfficer {
  id: number;
  name: string;
  title: string;
  imageUrl: string;
  bio: string;
}

@Component({
  selector: 'app-loan-officers',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './loan-officers.component.html',
  styleUrl: './loan-officers.component.scss'
})
export class LoanOfficersComponent {
  loanOfficers: LoanOfficer[] = [
    {
      id: 1,
      name: 'Michael DeMie',
      title: 'Mortgage Broker',
      imageUrl: 'assets/loan-officers/michael_d.jpg',
      bio: 'Michael has over 25 years of experience in the mortgage industry. He is basically a real wiz at this type of stuff.'
    },
    {
      id: 2,
      name: 'Emilee Smith',
      title: 'Loan Officer',
      imageUrl: 'assets/loan-officers/emilee_s.png',
      bio: 'Emilee brings 6 years of expertise in saving people\'s asses to the table. Her attention to detail and commitment to client satisfaction have earned her consistent 5-star reviews.'
    },
    {
      id: 3,
      name: 'José "Hot Taco" Mendoza',
      title: 'Loan Officer',
      imageUrl: 'assets/loan-officers/phil_m.jpeg',
      bio: 'José has been in the mortgage industry for 2 weeks and already he\'s lost some people their loan. To be honest, I\m starting to think he\s just a statue outside a Mexican Restaurant.'
    }
  ];

  selectedOfficer: LoanOfficer | null = null;
  showModal = false;

  openModal(officer: LoanOfficer): void {
    this.selectedOfficer = officer;
    this.showModal = true;
    document.body.classList.add('modal-open');
  }

  closeModal(): void {
    this.showModal = false;
    document.body.classList.remove('modal-open');
  }
}