const Review = require('../models/Review');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');

class ReviewsController {
    // GET /api/reviews - все отзывы
    static async getAll(req, res) {
        try {
            const reviews = await Review.findAll();
            
            // Добавляем информацию о клиентах и тренерах
            const enrichedReviews = await Promise.all(
                reviews.map(async (review) => {
                    const member = await Member.findById(review.memberId);
                    const trainer = await Trainer.findById(review.trainerId);
                    
                    return {
                        ...review,
                        member: member ? {
                            id: member.id,
                            fullName: member.fullName
                        } : null,
                        trainer: trainer ? {
                            id: trainer.id,
                            fullName: trainer.fullName,
                            specialization: trainer.specialization
                        } : null
                    };
                })
            );
            
            res.json(enrichedReviews);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/reviews/:id - отзыв по ID
    static async getById(req, res) {
        try {
            const review = await Review.findById(req.params.id);
            if (!review) {
                return res.status(404).json({ error: 'Отзыв не найден' });
            }
            
            // Добавляем информацию о клиенте и тренере
            const member = await Member.findById(review.memberId);
            const trainer = await Trainer.findById(review.trainerId);
            
            const enrichedReview = {
                ...review,
                member: member ? {
                    id: member.id,
                    fullName: member.fullName
                } : null,
                trainer: trainer ? {
                    id: trainer.id,
                    fullName: trainer.fullName,
                    specialization: trainer.specialization
                } : null
            };
            
            res.json(enrichedReview);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // POST /api/reviews - создать отзыв
    static async create(req, res) {
        try {
            const { memberId, trainerId, rating, comment } = req.body;
            
            // Валидация
            if (!memberId || !trainerId || !rating) {
                return res.status(400).json({ 
                    error: 'ID клиента, ID тренера и рейтинг обязательны' 
                });
            }
            
            if (rating < 1 || rating > 5) {
                return res.status(400).json({ 
                    error: 'Рейтинг должен быть от 1 до 5' 
                });
            }
            
            // Проверяем существование клиента и тренера
            const member = await Member.findById(memberId);
            const trainer = await Trainer.findById(trainerId);
            
            if (!member) {
                return res.status(404).json({ error: 'Клиент не найден' });
            }
            
            if (!trainer) {
                return res.status(404).json({ error: 'Тренер не найден' });
            }
            
            const review = await Review.create(req.body);
            
            // Обновляем рейтинг тренера
            await Trainer.updateRating(trainerId);
            
            res.status(201).json(review);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // PUT /api/reviews/:id - обновить отзыв
    static async update(req, res) {
        try {
            const { rating } = req.body;
            
            // Проверяем существование отзыва
            const existingReview = await Review.findById(req.params.id);
            if (!existingReview) {
                return res.status(404).json({ error: 'Отзыв не найден' });
            }
            
            // Валидация рейтинга
            if (rating && (rating < 1 || rating > 5)) {
                return res.status(400).json({ 
                    error: 'Рейтинг должен быть от 1 до 5' 
                });
            }
            
            const review = await Review.update(req.params.id, req.body);
            
            // Обновляем рейтинг тренера
            await Trainer.updateRating(review.trainerId);
            
            res.json(review);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // DELETE /api/reviews/:id - удалить отзыв
    static async delete(req, res) {
        try {
            // Получаем отзыв перед удалением для обновления рейтинга тренера
            const review = await Review.findById(req.params.id);
            if (!review) {
                return res.status(404).json({ error: 'Отзыв не найден' });
            }
            
            const success = await Review.delete(req.params.id);
            
            if (success) {
                // Обновляем рейтинг тренера
                await Trainer.updateRating(review.trainerId);
                res.status(204).end();
            } else {
                res.status(404).json({ error: 'Отзыв не найден' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/reviews/trainer/:trainerId - отзывы тренера
    static async getByTrainer(req, res) {
        try {
            const reviews = await Review.findByTrainer(req.params.trainerId);
            
            // Добавляем информацию о клиентах
            const enrichedReviews = await Promise.all(
                reviews.map(async (review) => {
                    const member = await Member.findById(review.memberId);
                    
                    return {
                        ...review,
                        member: member ? {
                            id: member.id,
                            fullName: member.fullName
                        } : null
                    };
                })
            );
            
            res.json(enrichedReviews);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // GET /api/reviews/member/:memberId - отзывы клиента
    static async getByMember(req, res) {
        try {
            const reviews = await Review.findByMember(req.params.memberId);
            
            // Добавляем информацию о тренерах
            const enrichedReviews = await Promise.all(
                reviews.map(async (review) => {
                    const trainer = await Trainer.findById(review.trainerId);
                    
                    return {
                        ...review,
                        trainer: trainer ? {
                            id: trainer.id,
                            fullName: trainer.fullName,
                            specialization: trainer.specialization
                        } : null
                    };
                })
            );
            
            res.json(enrichedReviews);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = ReviewsController;