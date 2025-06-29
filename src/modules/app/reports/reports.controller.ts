import {
	Controller,
	Get,
	Post,
	Query,
	Body,
	Req,
	UseGuards,
} from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiQuery,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { GenerateReportDTO, ReportFormat } from './dtos/GenerateReport.dto';
import { UseAuth } from '@/guards/useAuth';

@ApiTags('Reports - Relatórios Avançados')
@ApiBearerAuth()
@UseGuards(UseAuth)
@Controller('app/reports')
export class ReportsController {
	constructor(private readonly reportsService: ReportsService) {}

	@Post('generate')
	@ApiOperation({
		summary: 'Gerar relatório customizado',
		description:
			'Gera um relatório personalizado com base nos parâmetros fornecidos.',
	})
	@ApiResponse({ status: 201, description: 'Relatório gerado com sucesso' })
	@ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
	async generateReport(
		@Body() generateDto: GenerateReportDTO,
		@Req() req: any,
	) {
		return this.reportsService.generateReport(req.user.userId, generateDto);
	}

	@Get('weekly')
	@ApiOperation({
		summary: 'Relatório semanal',
		description:
			'Gera um relatório das atividades da semana atual ou anterior.',
	})
	@ApiQuery({
		name: 'weekOffset',
		required: false,
		type: 'number',
		description: 'Número de semanas atrás (0 = semana atual)',
		example: 0,
	})
	@ApiResponse({ status: 200, description: 'Relatório semanal gerado' })
	async getWeeklyReport(@Req() req: any) {
		return this.reportsService.getWeeklyReport(req.user.userId);
	}

	@Get('monthly')
	@ApiOperation({
		summary: 'Relatório mensal',
		description: 'Gera um relatório das atividades do mês atual ou anterior.',
	})
	@ApiQuery({
		name: 'monthOffset',
		required: false,
		type: 'number',
		description: 'Número de meses atrás (0 = mês atual)',
		example: 0,
	})
	@ApiResponse({ status: 200, description: 'Relatório mensal gerado' })
	async getMonthlyReport(@Req() req: any) {
		return this.reportsService.getMonthlyReport(req.user.userId);
	}

	@Post('export')
	@ApiOperation({
		summary: 'Exportar relatório',
		description:
			'Exporta dados de relatório em diferentes formatos (JSON, CSV, PDF).',
	})
	@ApiQuery({
		name: 'format',
		required: false,
		enum: ReportFormat,
		description: 'Formato de exportação',
		example: ReportFormat.JSON,
	})
	@ApiResponse({ status: 200, description: 'Relatório exportado com sucesso' })
	async exportReport(
		@Body() reportData: any,
		@Query('format') format: ReportFormat = ReportFormat.JSON,
		@Req() req: any,
	) {
		return this.reportsService.exportReport(
			req.user.userId,
			reportData,
			format,
		);
	}
}
