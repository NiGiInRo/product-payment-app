import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MerchantAcceptanceTokens,
  MerchantGateway,
} from '../../application/ports/merchant.gateway';
import { MerchantConfigError } from '../../domain/errors/merchant-config.error';

interface ProviderMerchantResponse {
  data?: {
    presigned_acceptance?: {
      acceptance_token?: string;
      permalink?: string;
    };
    presigned_personal_data_auth?: {
      acceptance_token?: string;
      permalink?: string;
    };
  };
}

@Injectable()
export class ProviderMerchantHttpGateway implements MerchantGateway {
  constructor(private readonly configService: ConfigService) {}

  async getMerchantAcceptanceTokens(
    merchantPublicKey: string,
  ): Promise<MerchantAcceptanceTokens> {
    const apiUrl =
      this.configService.get<string>('PAYMENT_PROVIDER_API_URL') ??
      this.configService.get<string>('WOMPI_API_URL');

    if (!apiUrl) {
      throw new MerchantConfigError(
        'PAYMENT_PROVIDER_API_URL is not configured for merchant token retrieval.',
      );
    }

    const response = await fetch(
      `${apiUrl}/merchants/${encodeURIComponent(merchantPublicKey)}`,
    );

    if (!response.ok) {
      throw new MerchantConfigError(
        `Payment provider merchant lookup failed with status ${response.status}.`,
      );
    }

    const payload = (await response.json()) as ProviderMerchantResponse;
    const acceptance = payload.data?.presigned_acceptance;

    if (!acceptance?.acceptance_token || !acceptance.permalink) {
      throw new MerchantConfigError(
        'Payment provider merchant response did not include a valid acceptance token.',
      );
    }

    return {
      acceptanceToken: acceptance.acceptance_token,
      acceptancePermalink: acceptance.permalink,
      personalDataAuthToken:
        payload.data?.presigned_personal_data_auth?.acceptance_token,
      personalDataAuthPermalink:
        payload.data?.presigned_personal_data_auth?.permalink,
    };
  }
}
