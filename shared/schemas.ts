import { z } from 'zod';

export const PostoSchema = z.object({
  razaoSocial: z.string().default(''),
  cnpj: z.string().default(''),
  endereco: z.string().default(''),
  cep: z.string().default(''),
  fone: z.string().default(''),
});

export const ProdutoSchema = z.object({
  nome: z.string().default(''),
  quantidade: z.string().default(''),
  valorUnitario: z.string().default(''),
  total: z.string().default(''),
});

export const TotaisSchema = z.object({
  valorTotal: z.string().default(''),
});

export const NfceDataSchema = z.object({
  posto: PostoSchema,
  produtos: z.array(ProdutoSchema),
  totais: TotaisSchema,
  confianca: z.number().optional(),
});

export type Posto = z.infer<typeof PostoSchema>;
export type Produto = z.infer<typeof ProdutoSchema>;
export type Totais = z.infer<typeof TotaisSchema>;
export type NfceData = z.infer<typeof NfceDataSchema>;
