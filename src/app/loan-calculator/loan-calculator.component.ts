import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';

// Register all Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-loan-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './loan-calculator.component.html',
  styleUrl: './loan-calculator.component.scss'
})
export class LoanCalculatorComponent implements OnInit, AfterViewInit {
  @ViewChild('paymentChart') paymentChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('amortizationChart') amortizationChart!: ElementRef<HTMLCanvasElement>;
  
  calculatorForm!: FormGroup;
  monthlyPayment: number = 0;
  totalInterest: number = 0;
  totalPayment: number = 0;
  
  // Charts
  paymentBreakdownChart: Chart | null = null;
  amortizationScheduleChart: Chart | null = null;
  
  // Mobile detection
  isMobile: boolean = false;
  
  // Default loan values
  loanTypes = [
    { value: 'conventional', label: 'Conventional Loan' },
    { value: 'fha', label: 'FHA Loan' },
    { value: 'va', label: 'VA Loan' },
    { value: 'usda', label: 'USDA Loan' },
    { value: 'jumbo', label: 'Jumbo Loan' }
  ];
  
  constructor(private fb: FormBuilder) {
    // Check mobile on init
    this.checkMobile();
  }
  
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkMobile();
    this.calculateLoan();
  }
  
  checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
  }
  
  ngOnInit(): void {
    this.initForm();
  }
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.calculateLoan();
    }, 0);
  }
  
  initForm(): void {
    this.calculatorForm = this.fb.group({
      loanAmount: [300000, [Validators.required, Validators.min(1000)]],
      interestRate: [4.5, [Validators.required, Validators.min(0.1), Validators.max(25)]],
      loanTerm: [30, [Validators.required, Validators.min(1), Validators.max(40)]],
      downPayment: [60000, [Validators.required, Validators.min(0)]],
      propertyTax: [2400, [Validators.required, Validators.min(0)]],
      homeInsurance: [1200, [Validators.required, Validators.min(0)]],
      pmi: [0, [Validators.required, Validators.min(0)]],
      loanType: ['conventional', [Validators.required]]
    });
    
    // Listen for form changes and recalculate
    this.calculatorForm.valueChanges.subscribe(() => {
      this.calculateLoan();
    });
  }
  
  calculateLoan(): void {
    if (this.calculatorForm.invalid) {
      return;
    }
    
    const loanAmount = this.calculatorForm.get('loanAmount')?.value || 0;
    const downPayment = this.calculatorForm.get('downPayment')?.value || 0;
    const interestRate = this.calculatorForm.get('interestRate')?.value || 0;
    const loanTerm = this.calculatorForm.get('loanTerm')?.value || 0;
    const propertyTax = this.calculatorForm.get('propertyTax')?.value || 0;
    const homeInsurance = this.calculatorForm.get('homeInsurance')?.value || 0;
    const pmi = this.calculatorForm.get('pmi')?.value || 0;
    
    // Calculate loan details
    const principal = loanAmount - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    
    // Calculate monthly principal and interest payment
    const monthlyPrincipalAndInterest = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    // Monthly property tax and insurance payments
    const monthlyPropertyTax = propertyTax / 12;
    const monthlyHomeInsurance = homeInsurance / 12;
    const monthlyPMI = pmi;
    
    // Total monthly payment
    this.monthlyPayment = monthlyPrincipalAndInterest + monthlyPropertyTax + monthlyHomeInsurance + monthlyPMI;
    
    // Total amount paid over loan term
    this.totalPayment = this.monthlyPayment * numberOfPayments;
    
    // Total interest paid
    this.totalInterest = (this.monthlyPayment * numberOfPayments) - principal;
    
    // Generate amortization schedule for the chart
    this.generateAmortizationData(principal, monthlyRate, numberOfPayments, monthlyPrincipalAndInterest);
    
    // Update payment breakdown chart
    this.updatePaymentBreakdownChart(
      monthlyPrincipalAndInterest, 
      monthlyPropertyTax, 
      monthlyHomeInsurance, 
      monthlyPMI
    );
  }
  
  generateAmortizationData(principal: number, monthlyRate: number, numberOfPayments: number, monthlyPayment: number): void {
    let balance = principal;
    const principalData = [];
    const interestData = [];
    const balanceData = [];
    const labels = [];
    
    // Generate yearly points instead of monthly to keep the chart manageable
    for (let year = 0; year <= Math.ceil(numberOfPayments / 12); year++) {
      // Use actual month count for the final year
      const monthsInYear = (year === Math.ceil(numberOfPayments / 12)) 
        ? (numberOfPayments % 12 || 12) 
        : 12;
        
      let yearlyPrincipal = 0;
      let yearlyInterest = 0;
      
      for (let month = 0; month < monthsInYear; month++) {
        if (balance <= 0) break;
        
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        
        yearlyPrincipal += principalPayment;
        yearlyInterest += interestPayment;
        
        balance = Math.max(0, balance - principalPayment);
      }
      
      principalData.push(yearlyPrincipal);
      interestData.push(yearlyInterest);
      balanceData.push(balance);
      labels.push(`Year ${year + 1}`);
      
      if (balance <= 0) break;
    }
    
    this.updateAmortizationChart(labels, principalData, interestData, balanceData);
  }
  
  updatePaymentBreakdownChart(principalAndInterest: number, propertyTax: number, homeInsurance: number, pmi: number): void {
    if (!this.paymentChart) return;
    
    if (this.paymentBreakdownChart) {
      this.paymentBreakdownChart.destroy();
    }
    
    const ctx = this.paymentChart.nativeElement.getContext('2d');
    if (!ctx) return;
    
    this.paymentBreakdownChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Principal & Interest', 'Property Tax', 'Home Insurance', 'PMI'],
        datasets: [{
          data: [principalAndInterest, propertyTax, homeInsurance, pmi],
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 99, 132, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Monthly Payment Breakdown',
            font: {
              size: this.isMobile ? 14 : 16
            }
          },
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: this.isMobile ? 12 : 40,
              padding: this.isMobile ? 8 : 10,
              font: {
                size: this.isMobile ? 10 : 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw as number;
                return `$${value.toFixed(2)} per month`;
              }
            }
          }
        }
      }
    });
  }
  
  updateAmortizationChart(labels: string[], principalData: number[], interestData: number[], balanceData: number[]): void {
    if (!this.amortizationChart) return;
    
    if (this.amortizationScheduleChart) {
      this.amortizationScheduleChart.destroy();
    }
    
    const ctx = this.amortizationChart.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Create a smaller dataset for mobile to improve readability
    let mobileLabels = [...labels];
    let mobilePrincipalData = [...principalData];
    let mobileInterestData = [...interestData];
    let mobileBalanceData = [...balanceData];
    
    // For mobile, reduce the number of data points to show only every 5 years or so
    if (this.isMobile && labels.length > 10) {
      mobileLabels = labels.filter((_, i) => i % 5 === 0 || i === labels.length - 1);
      mobilePrincipalData = principalData.filter((_, i) => i % 5 === 0 || i === principalData.length - 1);
      mobileInterestData = interestData.filter((_, i) => i % 5 === 0 || i === interestData.length - 1);
      mobileBalanceData = balanceData.filter((_, i) => i % 5 === 0 || i === balanceData.length - 1);
    }
    
    this.amortizationScheduleChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.isMobile ? mobileLabels : labels,
        datasets: [
          {
            label: 'Principal',
            data: this.isMobile ? mobilePrincipalData : principalData,
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            stack: 'Stack 0'
          },
          {
            label: 'Interest',
            data: this.isMobile ? mobileInterestData : interestData,
            backgroundColor: 'rgba(255, 99, 132, 0.8)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            stack: 'Stack 0'
          },
          {
            label: 'Balance',
            data: this.isMobile ? mobileBalanceData : balanceData,
            type: 'line',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            fill: false,
            tension: 0.1,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Years'
            },
            ticks: {
              maxRotation: this.isMobile ? 45 : 0, // Rotate labels on mobile for better fit
              font: {
                size: this.isMobile ? 10 : 12 // Smaller font on mobile
              }
            }
          },
          y: {
            stacked: true,
            title: {
              display: !this.isMobile, // Hide title on mobile to save space
              text: 'Payment Amount ($)'
            },
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              },
              font: {
                size: this.isMobile ? 10 : 12 // Smaller font on mobile
              }
            }
          },
          y1: {
            position: 'right',
            grid: {
              drawOnChartArea: false
            },
            title: {
              display: !this.isMobile, // Hide title on mobile to save space
              text: 'Remaining Balance ($)'
            },
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              },
              font: {
                size: this.isMobile ? 10 : 12 // Smaller font on mobile
              }
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Amortization Schedule',
            font: {
              size: this.isMobile ? 14 : 16
            }
          },
          legend: {
            labels: {
              boxWidth: this.isMobile ? 10 : 40, // Smaller legend boxes on mobile
              padding: this.isMobile ? 8 : 10,
              font: {
                size: this.isMobile ? 10 : 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw as number;
                return `${context.dataset.label}: $${value.toLocaleString()}`;
              }
            }
          }
        }
      }
    });
  }
  
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
  
  resetForm(): void {
    this.initForm();
    this.calculateLoan();
  }
}