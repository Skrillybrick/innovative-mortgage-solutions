import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loan-application',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loan-application.component.html',
  styleUrl: './loan-application.component.scss'
})
export class LoanApplicationComponent implements OnInit {
  officerId: number | null = null;
  
  constructor(private route: ActivatedRoute) {}
  
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['officer']) {
        this.officerId = Number(params['officer']);
      }
    });
  }
}