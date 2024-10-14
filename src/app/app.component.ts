import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import QRCode from 'qrcode';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [CommonModule, FormsModule]
})
export class AppComponent {
  qrCodeLink: string | null = null;
  systemCode: string = '';
  zone: number = 1;
  zones: number[] = [1, 2];
  isDownloading: boolean = false;
  isCompleted: boolean = false;

  // Encrypted base URL
  private readonly encryptedBaseUrl: string = 'U2FsdGVkX1/1yZkiJN4M/EzmPy8dbdiwhpXndKqyMe3z7X3M9i7WVdzW2thhHjIzfHaurdzbWS5/pALALrKtUESu8DlxOiQAs5k5PajT7mg=';
  private readonly secretKey: string = 'ultratopsecret'; 

  async generateQRCode() {
    this.qrCodeLink = `${this.systemCode}&zone=${this.zone}&s=q`;
    this.isDownloading = true;
    await this.generateAndDownloadQRCode();
    this.isDownloading = false;
    this.isCompleted = true;
  }

  resetPage() {
    this.systemCode = '';
    this.zone = 1;
    this.qrCodeLink = null;
    this.isDownloading = false;
    this.isCompleted = false;
  }

  private async generateAndDownloadQRCode() {
    if (this.qrCodeLink) {
      try {
        // Decrypt the base URL
        const decryptedBaseUrl = CryptoJS.AES.decrypt(this.encryptedBaseUrl, this.secretKey).toString(CryptoJS.enc.Utf8);
        
        // Construct the full URL
        const fullUrl = `${decryptedBaseUrl}?system=${this.qrCodeLink}`;

        const qrCodeDataUrl = await QRCode.toDataURL(fullUrl, {
          width: 320,
          margin: 0,
          color: {
            dark: '#000000FF',
            light: '#FFFFFF00'
          }
        });

        const img = new Image();
        img.src = qrCodeDataUrl;
        await new Promise(resolve => img.onload = resolve);

        const canvas = document.createElement('canvas');
        canvas.width = 401;
        canvas.height = 378;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        ctx.drawImage(img, (canvas.width - img.width) / 2, 10);

        ctx.fillStyle = 'black';
        ctx.font = 'bold 25px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.systemCode}`, canvas.width / 2, canvas.height - 15);

        const blob = await new Promise<Blob>(resolve =>
          canvas.toBlob(blob => resolve(blob!), 'image/png')
        );

        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = `qrcode_${this.systemCode}_Zone${this.zone}.png`;

        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    }
  }
}