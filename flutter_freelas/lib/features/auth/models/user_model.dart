import 'package:json_annotation/json_annotation.dart';
import 'package:hive/hive.dart';

part 'user_model.g.dart';

@JsonSerializable()
@HiveType(typeId: 0)
class UserModel {
  @HiveField(0)
  final String id;
  
  @HiveField(1)
  final String name;
  
  @HiveField(2)
  final String email;
  
  @HiveField(3)
  final String phone;
  
  @HiveField(4)
  @JsonKey(name: 'user_type')
  final int userType;
  
  @HiveField(5)
  @JsonKey(name: 'created_at')
  final String createdAt;
  
  @HiveField(6)
  @JsonKey(name: 'is_active')
  final bool isActive;
  
  @HiveField(7)
  final String? avatar;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.userType,
    required this.createdAt,
    required this.isActive,
    this.avatar,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => _$UserModelFromJson(json);
  Map<String, dynamic> toJson() => _$UserModelToJson(this);

  bool get isProvider => userType == 1;
  bool get isClient => userType == 2;

  UserModel copyWith({
    String? id,
    String? name,
    String? email,
    String? phone,
    int? userType,
    String? createdAt,
    bool? isActive,
    String? avatar,
  }) {
    return UserModel(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      userType: userType ?? this.userType,
      createdAt: createdAt ?? this.createdAt,
      isActive: isActive ?? this.isActive,
      avatar: avatar ?? this.avatar,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is UserModel && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() {
    return 'UserModel(id: $id, name: $name, email: $email, userType: $userType)';
  }
}

@JsonSerializable()
class AuthResponse {
  @JsonKey(name: 'access_token')
  final String accessToken;
  
  @JsonKey(name: 'user_data')
  final UserModel userData;

  const AuthResponse({
    required this.accessToken,
    required this.userData,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) => _$AuthResponseFromJson(json);
  Map<String, dynamic> toJson() => _$AuthResponseToJson(this);
}

@JsonSerializable()
class LoginRequest {
  final String email;
  final String password;

  const LoginRequest({
    required this.email,
    required this.password,
  });

  factory LoginRequest.fromJson(Map<String, dynamic> json) => _$LoginRequestFromJson(json);
  Map<String, dynamic> toJson() => _$LoginRequestToJson(this);
}

@JsonSerializable()
class RegisterRequest {
  final String name;
  final String email;
  final String phone;
  final String password;
  @JsonKey(name: 'user_type')
  final int userType;

  const RegisterRequest({
    required this.name,
    required this.email,
    required this.phone,
    required this.password,
    required this.userType,
  });

  factory RegisterRequest.fromJson(Map<String, dynamic> json) => _$RegisterRequestFromJson(json);
  Map<String, dynamic> toJson() => _$RegisterRequestToJson(this);
}
